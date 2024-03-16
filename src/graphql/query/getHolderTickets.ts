import { gql } from "@apollo/client";

export const GET_HOLDER_TICKETS = (
    id: string
) => gql`query GetHolderTickets($id: ID = "${id}") {
    holder(id: $id) {
      tickets {
        tokenId
      }
    }
  }
  `;
