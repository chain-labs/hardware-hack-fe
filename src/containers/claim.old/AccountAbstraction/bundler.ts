import { TEST_NETWORK } from "@/constants";
import { Bundler, IBundler } from "@biconomy/bundler";
import { ChainId } from "@biconomy/core-types";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/modules";

const CHAIN_ID = TEST_NETWORK
    ? ChainId.POLYGON_MUMBAI
    : ChainId.POLYGON_MAINNET;

const bundler: IBundler = new Bundler({
    bundlerUrl: `https://bundler.biconomy.io/api/v2/${CHAIN_ID}/dewj2189.wh1289hU-7E49-45ic-af80-p1rawpqvn`,
    chainId: CHAIN_ID,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
});

export default bundler;
