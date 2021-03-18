import React from "react";
import { Pdb } from "../../domain/entities/Pdb";
import { debugVariable } from "../../utils/debug";
import { useAppContext } from "../components/AppContext";
import { useLoader } from "../components/Loader";

export function usePdbLoader() {
    const { compositionRoot } = useAppContext();
    const [loader, setLoader] = useLoader<Pdb>();

    React.useEffect(() => {
        const pdbOptions = {
            "6zow": { protein: "P0DTC2", pdb: "6zow", chain: "A" },
            "6lzg": { protein: "Q9BYF1", pdb: "6lzg", chain: "A" }, // Domain families
            "6w9c": { protein: "P0DTD1", pdb: "6w9c", chain: "A" },
            "1iyj": { protein: "P60896", pdb: "1iyj", chain: "A" },
            "2R5T": { protein: "O00141", pdb: "2R5T", chain: "A" }, // Kinenasa
        };

        setLoader({ type: "loading" });

        return compositionRoot.getPdb(pdbOptions["6lzg"]).run(
            pdb => setLoader({ type: "loaded", data: pdb }),
            error => setLoader({ type: "error", message: error.message })
        );
    }, [compositionRoot, setLoader]);

    React.useEffect(() => {
        if (loader.type === "loaded") debugVariable({ pdbData: loader.data });
    }, [loader]);

    return loader;
}