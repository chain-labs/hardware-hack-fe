import axios from "axios";

export const pinJson = async (JSONBody) => {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  return (
    await axios.post(url, JSONBody, {
      headers: {
        // pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
        // pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET,
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
    })
  ).data.IpfsHash;
};

export const pinFile = async (file, eventname) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const data = new FormData();
  data.append("file", file, "encryptedString.bin");
  const metadata = JSON.stringify({
    name: `${eventname}_encryptedString`,
  });
  data.append("pinataMetadata", metadata);
  return axios.post(url, data, {
    maxBodyLength: Infinity, //this is needed to prevent axios from erroring out with large files
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
  });
};
