import { NFT_ADDRESS } from "@/constants";
import { ITicket } from "@/graphql/query/fetchHolderTickets";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";

const TicketTile = ({
  ticket,
  ticketURI,
  isRevealed,
}: {
  ticket: ITicket;
  ticketURI: string;
  isRevealed: boolean;
}) => {
  const [ticketImg, setTicketImg] = useState("");

  useEffect(() => {
    axios
      .get(isRevealed ? `${ticketURI}/${ticket.tokenId}.json` : ticketURI)
      .then((res) => {
        console.log({ res: res.data });

        const imageCID = res.data.image.split("//")[1];
        console.log({ imageCID });

        setTicketImg(`https://nftstorage.link/ipfs/${imageCID}`);
      });
  }, [isRevealed, ticket.tokenId, ticketURI]);

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_OPENSEA_URL}${NFT_ADDRESS}/${ticket.tokenId}`}
      target="_blank"
    >
      <div className="max-w-[250px]">
        <div className="rounded-[32px] border-[8px] border-[#E2E7FF] bg-white overflow-hidden pb-6">
          <div className="relative mb-4 h-[132px] w-full overflow-hidden">
            <Image
              src={ticketImg}
              fill
              alt="ticket_img"
              style={{ objectFit: "cover" }}
            />
          </div>
          <h3 className="text-[16px] px-4 font-regular text-black-text">{`Ticket #${ticket.tokenId}`}</h3>
          <h3 className="text-[24px] px-4 font-bold text-black-text">{`${ticket?.simplrEvent?.name}`}</h3>
        </div>
      </div>
    </a>
  );
};

export default TicketTile;
