import _ from "lodash";
import { AtomicStructure, ChainObject } from "../../domain/entities/AtomicStructure";
import {
    AtomicStructureRepository,
    BuildOptions,
} from "../../domain/entities/AtomicStructureRepository";
import { FutureData } from "../../domain/entities/FutureData";
import { Future } from "../../utils/future";
import {
    annotationResponseExample,
    BionotesAnnotationResponse,
} from "./BionotesAnnotationResponse";

export class BionotesAtomicStructureRepository implements AtomicStructureRepository {
    build(_options: BuildOptions): FutureData<AtomicStructure> {
        const res = Future.success(
            annotationResponseExample
        ) as FutureData<BionotesAnnotationResponse>;
        return res.map(getAtomicStructureFromResponse);
    }
}

function getAtomicStructureFromResponse(annotation: BionotesAnnotationResponse): AtomicStructure {
    return {
        ...annotation,
        chains: _.mapValues(annotation.chains, (chains, chainName) =>
            chains.map(
                (chain): ChainObject => ({
                    ...chain,
                    id: [chainName, chain.acc].join("-"),
                    chainName,
                    name: chain.title.name.long,
                    org: chain.title.org.long,
                })
            )
        ),
    };
}
