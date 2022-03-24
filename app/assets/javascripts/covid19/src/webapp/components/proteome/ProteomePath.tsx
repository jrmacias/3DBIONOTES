import React from "react";
import { sendAnalytics } from "../../../utils/analytics";

export interface StateSetters {
    setSearch: (value: string) => void;
    setTitle: (value: React.ReactNode) => void;
    setProteomeSelected: (value: boolean) => void;
    setLoading: (value: boolean) => void;
    toggleProteome: () => void;
}

interface ProteomePathProps {
    name: string;
    classStyle: string;
    def: string;
    stateSetters: StateSetters;
}

export const ProteomePath: React.FC<ProteomePathProps> = React.memo(props => {
    const {
        name,
        classStyle,
        def,
        stateSetters: { setTitle, setSearch, setProteomeSelected, setLoading, toggleProteome },
    } = props;

    const triggerSearch = React.useCallback(() => {
        setLoading(true);
        setSearch(name);
        setProteomeSelected(true);
        toggleProteome();
        sendAnalytics({
            type: "event",
            category: "proteome",
            action: "select",
            label: name,
        });
        setTimeout(() => {
            setLoading(false);
        }, 1500);
    }, [name, setLoading, setProteomeSelected, setSearch, toggleProteome]);

    return (
        <path
            className={classStyle}
            d={def}
            onMouseEnter={() => setTitle(<span>{name}</span>)}
            onClick={triggerSearch}
        />
    );
});