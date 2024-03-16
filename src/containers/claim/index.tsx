import {
    BACKGROUND_MEDIA_DESKTOP,
    CONTRACT_ADDRESS,
    NFT_ADDRESS,
    OPENSEA_URL,
    TEST_NETWORK,
    TIKCET_IMAGE_URL,
} from "@/constants";
import "react-toastify/dist/ReactToastify.css";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import React, { useEffect, useState } from "react";
import { QueryProps } from "../claim/types";
import {
    BiconomySmartAccountV2,
    DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { FETCH_TREE_CID, getMerkleHashes, hashQueryData } from "./utils/hash";
import { BigNumber, ethers } from "ethers";
import MerkleTree from "merkletreejs";
import {
    DEFAULT_ECDSA_OWNERSHIP_MODULE,
    ECDSAOwnershipValidationModule,
} from "@biconomy/modules";
import { ChainId } from "@biconomy/core-types";
import bundler from "./AccountAbstraction/bundler";
import paymaster from "./AccountAbstraction/paymaster";
import { ToastContainer, toast } from "react-toastify";
import { handleEncryptandPin } from "./utils/lit";

import contracts from "@/contracts.json";
import {
    IHybridPaymaster,
    PaymasterMode,
    SponsorUserOperationDto,
} from "@biconomy/paymaster";
import Image from "next/image";
import {
    BG_ELEMENT,
    BG_ELEMENT_MOB,
    CALENDAR_ICON,
    GOOGLE_MAPS_LOCATION,
    LOCATION_ICON,
    LOGO,
    ORGANIZER,
    SIMPLR_EVENTS_H,
    SIMPLR_EVENTS_V,
    TICKET_ICON,
    dateTimeText,
    heroText,
    locationText,
    subHeader,
} from "@/copy";
import If from "@/components/If";
import { useQuery } from "graphql-hooks";
import { getHolderTokens } from "./getHolderTokens";

type Props = {
    query: QueryProps;
    noClaim?: boolean;
};

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
    const [tokens, setTokens] = useState([]);

    console.log({ TEST_NETWORK });

    useEffect(() => {
        if (smartAccount) {
            smartAccount._getAccountContract().then((data) => {
                const smartAccountAddress = data.address;
                getHolderTokens(NFT_ADDRESS, smartAccountAddress).then(
                    (tokens) => {
                        console.log({ tokens });
                        setTokens(tokens);
                    }
                );
            });
        }
    }, [address, mintStep, smartAccount]);

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
        if (mintStep === MINT_STEPS.MINTED) {
            const smartAccountAddress = (
                await smartAccount._getAccountContract()
            ).address;
            getHolderTokens(NFT_ADDRESS, smartAccountAddress).then((tokens) => {
                console.log({ tokens });
                setTokens(tokens);
            });
            setViewTickets(true);
            return;
        }
        e.preventDefault();
        setMintStep(MINT_STEPS.MINTING);

        const web3AuthProvider = await web3auth.connect();

        const user = await web3auth.getUserInfo();

        const provider = new ethers.providers.Web3Provider(web3AuthProvider);

        const signer = provider.getSigner();

        const addresses = await signer.getAddress();

        setAddress(addresses);

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

        const secretHash = await handleEncryptandPin(
            addresses,
            query,
            provider
        );

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

            const transaction = {
                to: CONTRACT_ADDRESS,
                data: minTx.data,
            };
            console.log({
                transaction,
                minTx,
                batchId: BigNumber.from(query?.batchid),
                hash: hashQueryData(query),
                secretHash,
                proofs,
                smartAccountAddress,
            });

            const partialUserOp = await biconomySmartAccount.buildUserOp([
                transaction,
            ]);

            const biconomyPaymaster =
                biconomySmartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
            console.log({ biconomyPaymaster });

            const paymasterServiceData: SponsorUserOperationDto = {
                mode: PaymasterMode.SPONSORED,
                smartAccountInfo: {
                    name: "BICONOMY",
                    version: "2.0.0",
                },
                calculateGasLimits: true,
            };
            console.log({ paymasterServiceData });
            try {
                const paymasterAndDataResponse =
                    await biconomyPaymaster.getPaymasterAndData(
                        partialUserOp,
                        paymasterServiceData
                    );
                partialUserOp.paymasterAndData =
                    paymasterAndDataResponse.paymasterAndData;
                console.log({ paymasterAndDataResponse, partialUserOp });
                if (
                    paymasterAndDataResponse.callGasLimit &&
                    paymasterAndDataResponse.verificationGasLimit &&
                    paymasterAndDataResponse.preVerificationGas
                ) {
                    // Returned gas limits must be replaced in your op as you update paymasterAndData.
                    // Because these are the limits paymaster service signed on to generate paymasterAndData
                    // If you receive AA34 error check here..

                    partialUserOp.callGasLimit =
                        paymasterAndDataResponse.callGasLimit;
                    partialUserOp.verificationGasLimit =
                        paymasterAndDataResponse.verificationGasLimit;
                    partialUserOp.preVerificationGas =
                        paymasterAndDataResponse.preVerificationGas;
                }
            } catch (e) {
                console.log("Error Received", e);
            }
            try {
                const userOpResponse = await biconomySmartAccount.sendUserOp(
                    partialUserOp
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
                console.log("Errored in userOPResponse", err);
            }
        } catch (err) {
            setMintStep(MINT_STEPS.INITIAL);
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
        if (noClaim) {
            return "View your Tickets";
        }
        switch (state) {
            case MINT_STEPS.INITIAL:
                return "Claim Ticket";
            case MINT_STEPS.MINTING:
                return "Claiming...";
            case MINT_STEPS.MINTED:
                return "View Tickets";
        }
    };

    const handleView = async (e) => {
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
        console.log({ smartAccountAddress });
        setViewTickets(true);
    };

    return (
        <div>
            <ToastContainer />
            {/* Background */}
            <div className="min-w-screen w-full min-h-screen">
                <div className="h-screen w-screen bg-black z-1 fixed">
                    <div className="bg-url-bg h-full w-full bg-cover">
                        <div className="parent flex flex-col items-center overflow-auto min-h-full relative">
                            <div className="flex flex-wrap lg:gap-x-24 gap-x-16 gap-y-0 justify-center">
                                <div className="child-1 order-1 lg:order-2 relative h-[350px] lg:w-[731px]">
                                    <div
                                        className="bg-[#CBFE5E] h-[350px] lg:w-[731px] w-[100vw]  flex flex-col items-center gap-y-1 lg:gap-y-2 overflow-visible relative"
                                        style={{
                                            clipPath:
                                                "polygon(0% 0%, 100% 0%, 100% 70%, 95% 70%, 95% 80%, 90% 80%, 90% 90%, 85% 90%, 85% 130%, 15% 130%, 15% 90%, 10% 90%, 10% 80%, 5% 80%, 5% 70%, 0% 70%)",
                                        }}
                                    >
                                        <div className="h-[70px] w-[70px] relative mt-10">
                                            <Image src={LOGO} fill alt="logo" />
                                        </div>
                                        <h1 className="md:text-[48px] text-[40px] font-bold text-center leading-snug">
                                            {heroText}
                                        </h1>
                                        <h3 className="text-[14px] font-medium">
                                            {subHeader}
                                        </h3>
                                        <div className="flex items-center text-black-text">
                                            <div className="md:h-[24px] md:w-[24px] h-[16px] w-[14px] relative">
                                                <Image
                                                    src={CALENDAR_ICON}
                                                    fill
                                                    alt="cal-icon"
                                                />
                                            </div>
                                            <h3 className="text-[14px] md:text-[16px] font-medium ">
                                                {`${dateTimeText} `}
                                            </h3>
                                        </div>
                                        <div className="flex items-center  text-black-text">
                                            <div className="md:h-[24px] md:w-[24px] h-[16px] w-[14px] relative">
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
                                        <If
                                            condition={!viewTickets}
                                            then={
                                                <button className="h-24 gap-x-2 flex items-center p-[24px] border-[9px] border-slate-prime bg-white mb-[-60px] mt-4 cursor-pointer">
                                                    <div className="relative h-[32px] w-[32px]">
                                                        <Image
                                                            src={TICKET_ICON}
                                                            alt="Ticket_icon"
                                                            fill
                                                        />
                                                    </div>
                                                    <p
                                                        className="text-[25px] font-bold"
                                                        onClick={
                                                            noClaim
                                                                ? handleView
                                                                : handleLogin
                                                        }
                                                    >
                                                        {getButtonText(
                                                            mintStep
                                                        )}
                                                    </p>
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="child-2 flex flex-col items-center order-2 lg:order-1 z-30 lg:mt-40 mt-20">
                                    <h3 className="text-white font-medium text-[16px] opacity-60">
                                        Organized by:
                                    </h3>
                                    <div className="relative h-[84px] w-[84px] mt-[32px]">
                                        <Image
                                            src={ORGANIZER}
                                            alt="organizer-logo"
                                            fill
                                        />
                                    </div>
                                </div>
                                <div className="child-3 flex flex-col items-center order-3 z-30 lg:mt-40 mt-20">
                                    <h3 className="text-white font-medium text-[16px] opacity-60">
                                        Tickets Powered by:
                                    </h3>
                                    <div className="relative h-[44px] w-[124px] mt-[32px] hidden lg:block">
                                        <Image
                                            className="object-contain"
                                            src={SIMPLR_EVENTS_H}
                                            alt="simplr-events-logo"
                                            fill
                                        />
                                    </div>
                                    <div className="relative h-[88px] w-[64px] mt-[32px] lg:hidden">
                                        <Image
                                            className="object-cover"
                                            src={SIMPLR_EVENTS_V}
                                            alt="simplr-events-logo"
                                            fill
                                        />
                                    </div>
                                </div>
                                <div className="absolute -bottom-0 mx-auto left-[50%] translate-x-[-50%]">
                                    <div
                                        className={`relative lg:h-[489px] h-[360px] lg:w-[80vw] w-[90vw] mx-auto opacity-50 lg:-mb-[64px] lg:opacity-${
                                            viewTickets ? "50" : "100"
                                        }`}
                                    >
                                        <Image
                                            src={BG_ELEMENT}
                                            alt="hero"
                                            fill
                                            className="object-contain hidden lg:block"
                                        />
                                        <Image
                                            src={BG_ELEMENT_MOB}
                                            alt="hero"
                                            fill
                                            className="object-contain lg:hidden block"
                                        />
                                    </div>
                                </div>
                            </div>
                            <If
                                condition={viewTickets}
                                then={
                                    <div className="order-4 z-30 mt-4">
                                        <h2 className="text-[25px] font-bold text-[#CBFE5E]">
                                            Here are your ticket(s)
                                        </h2>
                                        <div className="mt-4">
                                            {tokens.map((token) => (
                                                <a
                                                    href={`${OPENSEA_URL}/${token}`}
                                                    target="_blank"
                                                    key={`token-${token}`}
                                                >
                                                    <div
                                                        className="w-[250px] bg-[#CBFE5E]"
                                                        key={token}
                                                    >
                                                        <div className="relative w-full h-[131px]">
                                                            <Image
                                                                src={
                                                                    TIKCET_IMAGE_URL
                                                                }
                                                                alt="NFT_IMAGE"
                                                                className="object-cover"
                                                                fill
                                                            />
                                                        </div>
                                                        <div className="px-8 py-6 gap-y-2 flex flex-col">
                                                            <h3 className="text-[16px] font-normal">
                                                                Ticket #{token}
                                                            </h3>
                                                            <h4 className="text-[24px] font-bold">
                                                                John Doe
                                                            </h4>
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimContainer;
