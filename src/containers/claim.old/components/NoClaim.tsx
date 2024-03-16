import { BiconomySmartAccountV2 } from "@biconomy/account";
import { ChainId } from "@biconomy/core-types";
import {
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ECDSAOwnershipValidationModule,
} from "@biconomy/modules";
import { Web3Auth } from "@web3auth/modal";
import { ethers } from "ethers";
import React, { useState } from "react";
import bundler from "../AccountAbstraction/bundler";
import paymaster from "../AccountAbstraction/paymaster";
import ViewTickets from "./viewTickets";
import {
  BG_ELEMENT,
  BG_GRADIENT,
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
  web3Auth: Web3Auth;
};

const NoClaim = ({ web3Auth }: Props) => {
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2>();
  const [address, setAddress] = useState<string>();
  const handleLogin = async (e) => {
    console.log("login man", web3Auth);

    e.preventDefault();

    const web3AuthProvider = await web3Auth.connect();

    const user = await web3Auth.getUserInfo();

    const provider = new ethers.providers.Web3Provider(web3AuthProvider);

    const signer = provider.getSigner();

    const module_var = await ECDSAOwnershipValidationModule.create({
      signer: signer,
      moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
    });

    const biconomySmartAccount = await BiconomySmartAccountV2.create({
      chainId: ChainId.POLYGON_MUMBAI,
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

    setSmartAccount(biconomySmartAccount);
    setAddress(smartAccountAddress);
    window.open(
      `${
        process.env.NEXT_PUBLIC_OPENSEA_URL
      }${smartAccountAddress}?search[query]=${process.env.NEXT_PUBLIC_EVENT_NAME.replace(
        " ",
        "%20"
      )}`,
      "_blank",
      "noreferrer"
    );
  };

  return (
    <div className=" min-h-[100vh] md:bg-bottom bg-center  bg-no-repeat overflow-hidden">
      <div className="bg-black-text bg-repeat-y before:bg-gradient-url h-[100vh] w-[100vw] before:bg-cover before:bg-repeat-y before:bg-center before:mix-blend-hard-light relative before:absolute before:w-[100vw] before:h-[100vh] flex justify-center">
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
        <div className="absolute z-2 top-0 left- w-full flex md:items-end md:justify-between justify-center  md:pt-20 pt-10 flex-wrap md:flex-nowrap md:max-w-[1440px] gap-12 md:gap-0">
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
                <Image src={CALENDAR_ICON} fill alt="cal-icon" />
              </div>
              <h3 className="text-xs md:text-[16px] font-medium ">
                {`${dateTimeText} `}
              </h3>
            </div>
            <div className="flex items-center mt-2 text-black-text">
              <div className="h-[24px] w-[24px] relative">
                <Image src={LOCATION_ICON} fill alt="cal-icon" />
              </div>
              <a href={GOOGLE_MAPS_LOCATION} target="_blank" rel="noreferrer">
                <h3 className="text-xs md:text-[16px] font-medium hover:underline">
                  {locationText}
                </h3>
              </a>
            </div>
            {!address ? (
              <button
                className="flex items-center border-[9px] border-[#E2E7FF] rounded-[35px] bg-white py-[24px] px-[16px] font-black text-[25px] mt-8 text-black-text"
                onClick={handleLogin}
              >
                <div className="h-[32px] w-[32px] relative mr-2">
                  <Image src={TICKET_ICON} fill alt="cal-icon" />
                </div>
                View Ticket
              </button>
            ) : null}
            {/* {address ? (
              <div className="w-full md:max-w-[1440px] mx-auto flex justify-center md:hidden">
                <ViewTickets smartAccount={smartAccount} />
              </div>
            ) : null} */}
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
        {/* {address ? (
          <div className="relative w-full md:max-w-[1440px] mx-auto mt-[400px] md:flex justify-center hidden">
            <ViewTickets smartAccount={smartAccount} />
          </div>
        ) : null} */}
      </div>
    </div>
  );
};

export default NoClaim;
