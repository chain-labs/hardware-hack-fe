import { client } from "@/components/ApolloClient";
import FETCH_HOLDER_TICKETS, {
  ITicket,
} from "@/graphql/query/fetchHolderTickets";
import { BiconomySmartAccountV2 } from "@biconomy/account";
import React, { useCallback, useEffect, useState } from "react";
import TicketTile from "./TicketTile";
import FETCH_REVEALED from "@/graphql/query/fetchRevealed";
import { NFT_ADDRESS } from "@/constants";
import { ArrowCycle } from "akar-icons";

type Props = {
  smartAccount: BiconomySmartAccountV2;
};

const ViewTickets = ({ smartAccount }: Props) => {
  const [userTickets, setUserTickets] = useState([]);
  const [ticketURI, setTicketURI] = useState<string>();
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(true);

  const fetchRevealed = useCallback(async () => {
    console.log({ NFT_ADDRESS: NFT_ADDRESS.toLowerCase() });

    const res = await client.query({
      query: FETCH_REVEALED,
      variables: { address: NFT_ADDRESS.toLowerCase() },
    });

    const { data } = res;

    const isRevealed = !!data?.simplrEvents?.[0]?.isRevealed;
    const ticketURI = data?.simplrEvents?.[0]?.ticketURI;
    const ticketCid = ticketURI?.split("//")[1];
    setTicketURI(`https://nftstorage.link/ipfs/${ticketCid}`);
    setRevealed(isRevealed);
  }, []);

  const fetchHolderTickets = useCallback(async () => {
    let holderAddress;
    if (smartAccount.accountAddress) {
      holderAddress = smartAccount.accountAddress;
    } else {
      // @ts-ignore
      holderAddress: string = (await smartAccount._getAccountContract).address;
    }

    console.log({ holderAddress: holderAddress.toLowerCase() });

    const tickets = await client.query<{ tickets: ITicket[] }>({
      query: FETCH_HOLDER_TICKETS,
      variables: {
        first: 10,
        user_address_contains: holderAddress.toLowerCase(),
        event_address_contains: NFT_ADDRESS.toLowerCase(),
      },
    });
    setFetching(false);
    return tickets.data.tickets;
  }, [smartAccount._getAccountContract, smartAccount.accountAddress]);

  useEffect(() => {
    if (!loading) {
      fetchHolderTickets().then((tickets) => {
        console.log({ tickets });
        setUserTickets(tickets);
      });
    }
  }, [loading, fetchHolderTickets]);

  useEffect(() => {
    fetchRevealed().then(() => setLoading(false));
  }, [fetchRevealed]);

  useEffect(() => {
    if (userTickets) {
      console.log({ userTickets });
    }
  }, [userTickets]);

  return (
    <div className=" mt-6 w-[80vw] md:w-full">
      <h1 className="text-[25px] font-bold mb-4 text-center text-white">
        Here are your ticket(s)!
      </h1>
      
      {fetching ? (
        <span className="animate-spin">
          <ArrowCycle strokeWidth={2} size={30} />
        </span>
      ) : (
        <TicketsList
          userTickets={userTickets}
          ticketURI={ticketURI}
          revealed={revealed}
        />
      )}
    </div>
  );
};

export default ViewTickets;

const TicketsList = ({
  userTickets,
  ticketURI,
  revealed,
}: {
  userTickets: any[];
  ticketURI: string;
  revealed: boolean;
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {userTickets?.length ? (
        userTickets?.map((ticket) => (
          <TicketTile
            ticket={ticket}
            ticketURI={ticketURI}
            isRevealed={revealed}
            key={ticket.dataCid}
          />
        ))
      ) : (
        <h3 className="md:text-2xl md:px-4 md:py-2 px-2 py-1 rounded-md">
          No Tickets claimed yet...
        </h3>
      )}
    </div>
  );
};
