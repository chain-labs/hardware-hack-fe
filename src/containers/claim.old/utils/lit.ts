import { client } from "@/components/ApolloClient";
import { NFT_ADDRESS, SIMPLR_ADDRESS, TEST_NETWORK, chain } from "@/constants";
import { FETCH_EVENT_OWNER_QUERY } from "@/graphql/query/fetchEventOwnerAddress";
import LitJsSdk from "@lit-protocol/sdk-browser";
import { QueryProps } from "../types";
import { pinFile, pinJson } from "./pinata";

export const getAccessControlConditions = (addresses: string[]) => {
  const accessControlConditions = [];
  addresses.forEach((address) => {
    const condition = {
      contractAddress: "",
      standardContractType: "",
      chain: chain,
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: address,
      },
    };
    accessControlConditions.push(condition);
    accessControlConditions.push({ operator: "or" });
  });
  accessControlConditions.pop();
  return accessControlConditions;
};

export const getSignature = async (provider, address) => {
  console.log(provider, address);
  const authSig = await LitJsSdk.signAndSaveAuthMessage({
    web3: provider,
    account: address,
    chainId: TEST_NETWORK ? 80001 : 137,
  });
  return authSig;
};

export const encryptRawData = async (data) => {
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    JSON.stringify(data)
  );
  return { encryptedString, symmetricKey };
};

export const handleEncryptandPin = async (
  address: string,
  query: QueryProps,
  provider: any
) => {
  // Initialize Lit Protocol SDK
  const litClient = new LitJsSdk.LitNodeClient();
  await litClient.connect();

  console.log({ NFT_ADDRESS });

  // Fetch event owner address from Subgrqph to be used for access control condition
  const eventData = await client.query({
    query: FETCH_EVENT_OWNER_QUERY,
    variables: {
      address: NFT_ADDRESS,
    },
  });
  console.log(eventData);
  const eventOwnerAddress = eventData.data.simplrEvents[0].owner.address;

  // Define access control conditions
  const accessControlConditions = getAccessControlConditions([
    address,
    eventOwnerAddress,
    SIMPLR_ADDRESS,
  ]);

  // Creating raw data as object for encryption
  const rawData = {
    emailid: query.emailid,
    firstname: query.firstname,
    lastnama: query.lastname,
    batchid: query.batchid,
  };

  // Encrypt raw user data using Lit Protocol
  const { encryptedString, symmetricKey } = await encryptRawData(rawData);

  const signature = await getSignature(provider, address);
  console.log(signature);

  // Create encrypted key for decryption later
  const encryptedSymmetricKey = await litClient.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig: signature,
    chain: "mumbai",
  });

  // Pinning encrypted string file to NFT Storage
  const encryptedStringRes = await pinFile(encryptedString, query.eventname);

  const encryptedStringHash = encryptedStringRes.data.IpfsHash;

  // Define Secret object used for decryption of data
  const secret = {
    description: `A secret was sealed when claiming ticket from ${
      query.eventname
    } on ${Date.now()}`,
    name: query.eventname,
    external_url: "",
    image: new Blob(),
    image_description: "Photo by Folco Masi on Unsplash",
    secret: {
      accessControlConditions: accessControlConditions,
      encryptedSymmetricKey: LitJsSdk.uint8arrayToString(
        encryptedSymmetricKey,
        "base16"
      ),
      encryptedStringHash: encryptedStringHash,
    },
    attributes: [
      {
        display_type: "date",
        trait_type: "sealed on",
        value: Math.floor(Date.now() / 1000),
      },
    ],
  };

  // Pinning the secret to NFT Storage
  const secretHash = await pinJson(secret);
  return secretHash;

  // Move to next step
  // setCurrentStep(CLAIM_STEPS.MINT_TICKET)
};
