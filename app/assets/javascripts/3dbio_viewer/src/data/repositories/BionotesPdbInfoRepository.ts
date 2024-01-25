import _ from "lodash";
import { FutureData } from "../../domain/entities/FutureData";
import { PdbId } from "../../domain/entities/Pdb";
import { buildPdbInfo, PdbInfo } from "../../domain/entities/PdbInfo";
import { ChainId, Protein, ProteinId } from "../../domain/entities/Protein";
import { PdbInfoRepository } from "../../domain/repositories/PdbInfoRepository";
import { routes } from "../../routes";
import { Future } from "../../utils/future";
import { getFromUrl, RequestError } from "../request-utils";
import { emdbsFromPdbUrl, getEmdbsFromMapping, PdbEmdbMapping } from "./mapping";
import i18n from "../../domain/utils/i18n";

export class BionotesPdbInfoRepository implements PdbInfoRepository {
    get(pdbId: PdbId): FutureData<PdbInfo> {
        const proteinMappingUrl = `${routes.bionotes}/api/mappings/PDB/Uniprot/${pdbId}`;
        const emdbMapping = `${emdbsFromPdbUrl}/${pdbId}`;
        const data$ = {
            uniprotMapping: getFromUrl<UniprotFromPdbMapping>(proteinMappingUrl).flatMapError(
                throwServiceUnavailable
            ),
            emdbMapping: getFromUrl<PdbEmdbMapping>(emdbMapping),
        };

        return Future.joinObj(data$).flatMap(data => {
            const { uniprotMapping, emdbMapping } = data;
            const proteinsMapping = uniprotMapping[pdbId.toLowerCase()];
            if (!proteinsMapping) {
                console.error(`Uniprot mapping not found for ${pdbId}`);
                return Future.error({
                    message: `No data found for PDB ${pdbId}. But you can try and visualize another PDB. If you believe this is incorrect, please contact us at: ...`,
                });
            }

            const emdbIds = getEmdbsFromMapping(emdbMapping, pdbId);
            const proteins = _(proteinsMapping).keys().join(",");
            const proteinsInfoUrl = `${routes.bionotes}/api/lengths/UniprotMulti/${proteins}`;
            const proteinsInfo$ = proteins
                ? getFromUrl<ProteinsInfo>(proteinsInfoUrl)
                : Future.success<ProteinsInfo, Error>({});

            return proteinsInfo$.map(proteinsInfo => {
                const proteins = _(proteinsInfo)
                    .toPairs()
                    .map(
                        ([proteinId, proteinInfo]): Protein => {
                            const [_length, name, gen, organism] = proteinInfo;
                            return { id: proteinId, name, gen, organism };
                        }
                    )
                    .value();

                return buildPdbInfo({
                    id: pdbId,
                    emdbs: emdbIds.map(emdbId => ({ id: emdbId })),
                    ligands: [],
                    proteins,
                    proteinsMapping,
                });
            });
        });
    }
}

function throwServiceUnavailable<T>(err: RequestError): Future<RequestError, T> {
    console.error("Service unavailable: ", err.message);

    return Future.error({
        message: i18n.t(
            "We apologize. Some of the services we relay on, are temporarily unavailable. Our team is working to resolve the issue, and we appreciate your patience. Please try again later."
        ),
    });
}

type UniprotFromPdbMapping = Record<PdbId, Record<ProteinId, ChainId[]>>;

type ProteinsInfo = Record<PdbId, ProteinInfo>;

// [length, name, uniprotCode, organism]
type ProteinInfo = [number, string, string, string];
