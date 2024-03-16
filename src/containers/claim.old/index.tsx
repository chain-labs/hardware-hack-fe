import React, { useEffect, useState } from "react";
import { QueryProps } from "./types";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { polygonMumbai } from "viem/chains";
import {
    DEFAULT_ECDSA_OWNERSHIP_MODULE,
    ECDSAOwnershipValidationModule,
} from "@biconomy/modules";
import { BigNumber, ethers } from "ethers";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    BiconomySmartAccountV2,
    DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { ChainId } from "@biconomy/core-types";
import { Bundler, IBundler } from "@biconomy/bundler";
import {
    BiconomyPaymaster,
    IHybridPaymaster,
    IPaymaster,
    PaymasterMode,
    SponsorUserOperationDto,
} from "@biconomy/paymaster";
import {
    CONTRACT_ADDRESS,
    NFT_ADDRESS,
    PAYMASTER_URL,
    TEST_NETWORK,
} from "@/constants";
import { handleEncryptandPin } from "./utils/lit";
import contracts from "@/contracts.json";
import { FETCH_TREE_CID, getMerkleHashes, hashQueryData } from "./utils/hash";
import { FETCH_TREE_CID_QUERY } from "@/graphql/query/fetchTreeCid";
import MerkleTree from "merkletreejs";
import bundler from "./AccountAbstraction/bundler";
import ViewTickets from "./components/viewTickets";
import NoClaim from "./components/NoClaim";
import paymaster from "./AccountAbstraction/paymaster";
import { ArrowCycle } from "akar-icons";
import {
    BG_ELEMENT,
    CALENDAR_ICON,
    GOOGLE_MAPS_LOCATION,
    LOCATION_ICON,
    LOGO,
    ORGANIZER,
    SIMPLR_EVENTS,
    TICKET_ICON,
    dateTimeText,
    heroText,
    locationText,
    subHeader,
} from "@/copy";
import Image from "next/image";

type Props = {
    query: QueryProps;
    noClaim?: boolean;
};
console.log({ TEST_NETWORK });
const Web3AuthOptions: Web3AuthOptions = {
    clientId: `${process.env.NEXT_PUBLIC_WEB3AUTH_ID}`,
    web3AuthNetwork: TEST_NETWORK ? "sapphire_devnet" : "sapphire_mainnet",
    authMode: "DAPP",
    chainConfig: TEST_NETWORK
        ? {
              chainNamespace: "eip155",
              chainId: "0x13881",
              rpcTarget: "https://rpc-mumbai.maticvigil.com/",
              blockExplorer: "https://mumbai.polygonscan.com/",
              displayName: "Polygon Mumbai",
              ticker: "MATIC",
              tickerName: "Matic",
          }
        : {
              chainNamespace: "eip155",
              chainId: "0x89",
              rpcTarget: "https://polygon-rpc.com/",
              blockExplorer: "https://polygonscan.com/",
              displayName: "Polygon Mainnet",
              ticker: "MATIC",
              tickerName: "Matic",
          },
};

const web3auth = new Web3Auth(Web3AuthOptions);

const MINT_STEPS = {
    INITIAL: 0,
    MINTING: 1,
    MINTED: 2,
};

const ClaimContainer = ({ query, noClaim }: Props) => {
    const [proofs, setProofs] = useState([]);
    const [mintStep, setMintStep] = useState(MINT_STEPS.INITIAL);
    const [viewTickets, setViewTickets] = useState(false);
    const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2>();
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (query?.batchid) {
            console.log({ batchId: query.batchid, NFT_ADDRESS });

            FETCH_TREE_CID(query?.batchid, NFT_ADDRESS.toLowerCase()).then(
                (data) => {
                    const hashCID = data?.batches?.[0]?.cid;
                    getMerkleHashes(hashCID).then((hashes) => {
                        const leafs = hashes.map((entry) =>
                            ethers.utils.keccak256(entry)
                        );
                        const tree = new MerkleTree(
                            leafs,
                            ethers.utils.keccak256,
                            {
                                sortPairs: true,
                            }
                        );
                        const leaf = ethers.utils.keccak256(
                            hashQueryData(query)
                        );
                        const proofs = tree.getHexProof(leaf);
                        console.log("proofs sire", { proofs });

                        setProofs(proofs);
                    });
                }
            );
        }
    }, [query]);

    useEffect(() => {
        console.log({ query });
        web3auth.initModal();
    }, [query]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMintStep(MINT_STEPS.MINTING);

        const web3AuthProvider = await web3auth.connect();

        const user = await web3auth.getUserInfo();

        const provider = new ethers.providers.Web3Provider(web3AuthProvider);

        const signer = provider.getSigner();

        const address = await signer.getAddress();

        setAddress(address);

        const module_var = await ECDSAOwnershipValidationModule.create({
            signer: signer,
            moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
        });

        const biconomySmartAccount = await BiconomySmartAccountV2.create({
            chainId: TEST_NETWORK
                ? ChainId.POLYGON_MUMBAI
                : ChainId.POLYGON_MAINNET,
            bundler: bundler,
            paymaster: paymaster,
            entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
            defaultValidationModule: module_var,
            activeValidationModule: module_var,
        });

        setSmartAccount(biconomySmartAccount);
        const accounts = await provider.listAccounts();

        const smartAccountAddress = (
            await biconomySmartAccount._getAccountContract()
        ).address;

        const toast1 = toast.info("Wrapping up your Gift....", {
            position: "top-right",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
        });

        const secretHash = await handleEncryptandPin(address, query, provider);

        const abi = [
            contracts?.[TEST_NETWORK ? "80001" : "137"][0]?.contracts?.[
                "SimplrEvents"
            ]?.["abi"].find((el) => el.name === "mintTicket"),
        ];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        try {
            const hash = hashQueryData(query);

            console.log("It's here", {
                b: query?.batchid,
                smartAccountAddress,
                hash,
                secretHash,
                proofs,
            });

            const minTx = await contract.populateTransaction.mintTicket(
                smartAccountAddress,
                BigNumber.from(query?.batchid),
                hash,
                secretHash,
                proofs,
                { value: 0 }
            );

            const tx1 = {
                to: CONTRACT_ADDRESS,
                data: minTx.data,
            };
            console.log({
                tx1,
                minTx,
                batchId: BigNumber.from(query?.batchid),
                hash: hashQueryData(query),
                secretHash,
                proofs,
                smartAccountAddress,
            });

            const userOp = await biconomySmartAccount.buildUserOp([tx1]);

            const biconomyPaymaster =
                biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
            console.log({ biconomyPaymaster });

            const paymasterServiceData: SponsorUserOperationDto = {
                mode: PaymasterMode.SPONSORED,
                smartAccountInfo: {
                    name: "BICONOMY",
                    version: "2.0.0",
                },
            };
            console.log({ paymasterServiceData });

            const paymasterAndDataResponse =
                await biconomyPaymaster.getPaymasterAndData(
                    userOp,
                    paymasterServiceData
                );
            console.log({ paymasterAndDataResponse });
            if (
                paymasterAndDataResponse.callGasLimit &&
                paymasterAndDataResponse.verificationGasLimit &&
                paymasterAndDataResponse.preVerificationGas
            ) {
                // Returned gas limits must be replaced in your op as you update paymasterAndData.
                // Because these are the limits paymaster service signed on to generate paymasterAndData
                // If you receive AA34 error check here..

                userOp.callGasLimit = paymasterAndDataResponse.callGasLimit;
                userOp.verificationGasLimit =
                    paymasterAndDataResponse.verificationGasLimit;
                userOp.preVerificationGas =
                    paymasterAndDataResponse.preVerificationGas;
            }

            userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
            console.log("hehe", {
                biconomySmartAccount,
                paymasterAndDataResponse,
                userOp,
            });
            const userOpResponse = await biconomySmartAccount.sendUserOp(
                userOp
            );
            console.log({ userOpResponse });
            const { receipt } = await userOpResponse.wait(1);
            toast.success(
                `✨ Congratulations! You have claimed your NFT Ticket! 🎁  ✨`,
                {
                    position: "top-right",
                    autoClose: 18000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                }
            );
            setMintStep(MINT_STEPS.MINTED);
            console.log("", { txHash: receipt.transactionHash });
        } catch (err) {
            console.error({ err });
            toast.clearWaitingQueue({ containerId: "toaster" });
            toast.error(`Something Went Wrong!`, {
                position: "top-right",
                autoClose: 18000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
        }

        console.log({
            module_var: module_var.signer,
            smartAccountAddress,
            accounts,
            biconomySmartAccount,
            secretHash,
        });

        console.log("📮done deal", { secretHash });
    };

    const getButtonText = (state) => {
        switch (state) {
            case MINT_STEPS.INITIAL:
                return "Claim Ticket";
            case MINT_STEPS.MINTING:
                return "Claiming...";
            case MINT_STEPS.MINTED:
                return "View Tickets";
        }
    };

    if (noClaim) {
        return <NoClaim web3Auth={web3auth} />;
    }

    const handleView = () => {
        setViewTickets(true);
    };

    return (
        <div className=" min-h-[100vh] max-h-[100vh] md:bg-bottom  bg-center  bg-no-repeat overflow-hidden">
            <ToastContainer />
            <div className="bg-black-text before:bg-gradient-url h-[100vh] w-[100vw] before:bg-cover before:bg-no-repeat before:bg-center before:mix-blend-hard-light relative before:absolute before:w-[100vw] before:h-[100vh] flex justify-center">
                <div className="bg-gradient-url mix-blend-screen h-[775px] w-[775px] rounded-full absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[55%]" />
                <div className="absolute bottom-0 left-1/2 md:animate-spin-element-md animate-spin-element  mix-blend-color-dodge  border border-black">
                    <div className="relative h-[548px] w-[548px] md:h-[674px] md:w-[674px]">
                        <Image
                            className="object-contain"
                            src={BG_ELEMENT}
                            fill
                            alt="logo"
                        />
                    </div>
                </div>
                <div className="absolute z-2 top-0 left- w-full flex md:items-end md:justify-between justify-center  md:pt-10 pt-10 flex-wrap md:flex-nowrap md:max-w-[1280px] gap-12 md:gap-0">
                    <div className="flex flex-col items-center order-2 md:order-1 ">
                        <h3 className="text-white font-medium text-[16px] opacity-60">
                            Organized by:
                        </h3>
                        <div className="relative h-[84px] w-[84px] mt-[32px]">
                            <Image src={ORGANIZER} alt="organizer-logo" fill />
                        </div>
                        <div className="relative h-[44px] w-[124px] mt-[32px]">
                            <Image
                                className="object-contain"
                                src={SIMPLR_EVENTS}
                                alt="simplr-events-logo"
                                fill
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-center order-1 md:order-2 w-[90vw]">
                        <div className="relative h-[70px] w-[70px]">
                            <Image src={LOGO} fill alt="logo" />d
                        </div>
                        <h1 className="text-[64px] mt-4 text-black-text font-bold">
                            {heroText}
                        </h1>
                        <div className="flex items-center text-black-text">
                            <div className="h-[24px] w-[24px] relative">
                                <Image
                                    src={CALENDAR_ICON}
                                    fill
                                    alt="cal-icon"
                                />
                            </div>
                            <h3 className="text-xs md:text-[16px] font-medium ">
                                {`${dateTimeText} `}
                            </h3>
                        </div>
                        <div className="flex items-center mt-2 text-black-text">
                            <div className="h-[24px] w-[24px] relative">
                                <Image
                                    src={LOCATION_ICON}
                                    fill
                                    alt="cal-icon"
                                />
                            </div>
                            <a
                                href={GOOGLE_MAPS_LOCATION}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <h3 className="text-xs md:text-[16px] font-medium hover:underline">
                                    {locationText}
                                </h3>
                            </a>
                        </div>
                        <button
                            className="flex items-center border-[9px] border-[#E2E7FF] rounded-[35px] bg-white py-[24px] px-[16px] font-black text-[25px] mt-8 text-black-text"
                            onClick={
                                mintStep === MINT_STEPS.MINTED
                                    ? () =>
                                          window.open(
                                              `${
                                                  process.env
                                                      .NEXT_PUBLIC_OPENSEA_URL
                                              }${address}?search[query]=${process.env.NEXT_PUBLIC_EVENT_NAME.replace(
                                                  " ",
                                                  "%20"
                                              )}`,
                                              "_blank",
                                              "noreferrer"
                                          )
                                    : handleLogin
                            }
                        >
                            {mintStep === MINT_STEPS.MINTING ? (
                                <span className="animate-spin ml-2">
                                    <ArrowCycle strokeWidth={2} size={24} />
                                </span>
                            ) : (
                                <div className="h-[32px] w-[32px] relative mr-2">
                                    <Image
                                        src={TICKET_ICON}
                                        fill
                                        alt="cal-icon"
                                    />
                                </div>
                            )}
                            {getButtonText(mintStep)}
                        </button>
                    </div>
                    <div className="flex flex-col items-center md:self-center order-3">
                        <h3 className="text-white font-medium text-[16px] opacity-60">
                            Tickets Powered by:
                        </h3>
                        <div className="relative h-[44px] w-[124px] mt-[32px]">
                            <Image
                                className="object-contain"
                                src={SIMPLR_EVENTS}
                                alt="simplr-events-logo"
                                fill
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimContainer;
