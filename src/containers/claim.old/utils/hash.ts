import { client } from "@/components/ApolloClient";
import { PINATA_GATEWAY_TOKEN } from "@/constants";
import { FETCH_TREE_CID_QUERY } from "@/graphql/query/fetchTreeCid";
import axios from "axios";
import { ethers } from "ethers";

export const hashQueryData = (query) => {
  const { emailid, lastname, firstname, eventname, batchid } = query;
  const concatenatedString = `${emailid}-${lastname}-${firstname}-${batchid}-${eventname}`;
  console.log({ concatenatedString });

  const hash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(concatenatedString)
  );
  return hash;
};

export const getMerkleHashes = async (cid: string) => {
  const url = `https://indigo-acceptable-cephalopod-251.mypinata.cloud/ipfs/${cid}?pinataGatewayToken=${PINATA_GATEWAY_TOKEN}`;
  const { data } = await axios.get(url);
  const hashes = data;
  console.log({ data, hashes });

  return hashes;
};

export const FETCH_TREE_CID = async (id: string, address: string) => {
  const tree_cid = await client.query({
    query: FETCH_TREE_CID_QUERY,
    variables: {
      id,
      address,
    },
  });

  console.log({ tree_cid });

  return tree_cid.data;
};
