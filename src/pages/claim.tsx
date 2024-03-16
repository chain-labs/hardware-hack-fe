import { SUBGRAPH_ENDPOINT } from "@/constants";
import { QueryProps } from "@/containers/claim/types";
import { ClientContext, GraphQLClient } from "graphql-hooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const ClaimComponent = dynamic(
    () => import("@/containers/claim").then((res) => res.default),
    {
        ssr: false,
    }
);

const ClaimPage = () => {
    const router = useRouter();

    const client = new GraphQLClient({
        url: SUBGRAPH_ENDPOINT,
    });

    useEffect(() => {
        localStorage.removeItem("openlogin_store");
        localStorage.removeItem("Web3Auth-cachedAdapter");
    }, []);

    const [query, setQuery] = useState<QueryProps>({
        firstname: "",
        lastname: "",
        eventname: "",
        batchid: "",
        emailid: "",
    });

    const checkQueryValidity = (query: QueryProps) => {
        const { firstname, lastname, eventname, batchid, emailid } = query;
        if (!firstname || !lastname || !eventname || !batchid || !emailid) {
            return false;
        }
        return true;
    };

    useEffect(() => {
        const query = router.query;

        if (query) {
            setQuery({
                firstname: query.firstname as string,
                lastname: query.lastname as string,
                emailid: query.emailid as string,
                batchid: query.batchid as string,
                eventname: query.eventname as string,
            });
        }
    }, [router.query]);

    return (
        <ClientContext.Provider value={client}>
            <ClaimComponent
                query={query}
                noClaim={!checkQueryValidity(query)}
            />
        </ClientContext.Provider>
    );
};

export default ClaimPage;
