import { PAYMASTER_URL } from "@/constants";
import { BiconomyPaymaster, IPaymaster } from "@biconomy/paymaster";

const paymaster: IPaymaster = new BiconomyPaymaster({
  paymasterUrl: PAYMASTER_URL,
});

export default paymaster;
