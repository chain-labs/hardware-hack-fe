import { client } from "@/components/ApolloClient";
import { GET_HOLDER_TICKETS } from "@/graphql/query/getHolderTickets";

export const getHolderTokens = async (contract: string, address: string) => {
    console.log({ contract, address });

    const id = `${contract}-${address}`.toLowerCase();
    console.log({ id });

    const tokenIds = await client.query({
        query: GET_HOLDER_TICKETS(id),
    });

    console.log({ tokenIds });

    return tokenIds.data?.holder?.tickets?.map((token) => token.tokenId);
};
