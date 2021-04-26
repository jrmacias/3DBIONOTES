import _ from "lodash";
import { FutureData } from "../../../domain/entities/FutureData";
import { Pdb } from "../../../domain/entities/Pdb";
import { PdbRepository } from "../../../domain/repositories/PdbRepository";
import { Future } from "../../../utils/future";
import { getTotalFeaturesLength } from "../../../domain/entities/Track";
import { debugVariable } from "../../../utils/debug";
import { getEmValidationFragments, PdbAnnotations } from "./tracks/em-validation";
import { EbiVariation, getVariants } from "./tracks/variants";
import { getPhosphiteFragments, PhosphositeUniprot } from "./tracks/phosphite";
import { Features, getFeatureFragments } from "./tracks/feature";
import { Coverage, getStructureCoverageFragments } from "./tracks/structure-coverage";
import { getMobiUniprotFragments, MobiUniprot } from "./tracks/mobi";
import { Cv19Tracks, getFunctionalMappingFragments } from "./tracks/functional-mapping";
import { on } from "../../../utils/misc";
import { getProteomicsFragments, Proteomics } from "./tracks/proteomics";
import { getPdbRedoFragments, PdbRedo } from "./tracks/pdb-redo";
import { getEpitomesFragments, IedbAnnotationsResponse } from "./tracks/epitomes";
import { getProtein, UniprotResponse } from "./uniprot";
import { getExperiment, PdbExperiment } from "./ebi-pdbe-api";
import { routes } from "../../../routes";
import { getTracksFromFragments } from "../../../domain/entities/Fragment2";
import { getPfamDomainFragments, PfamAnnotations } from "./tracks/pfam-domain";
import { getSmartDomainFragments, SmartAnnotations } from "./tracks/smart-domain";
import { getInterproDomainFragments, InterproAnnotations } from "./tracks/interpro-domain";
import { ElmdbUniprot, getElmdbUniprotFragments } from "./tracks/elmdb";
import { getJSON, getXML, RequestError } from "../../request-utils";
import { DbPtmAnnotations, getDbPtmFragments } from "./tracks/db-ptm";
import { getMolprobityFragments, MolprobityResponse } from "./molprobity";
import { AntigenicResponse, getAntigenicFragments } from "./tracks/antigenic";
import { getEmdbsFromPdbEmdbMapping, PdbEmdbMapping } from "./mapping";

interface Data {
    uniprot: UniprotResponse;
    pdbEmdbMapping: PdbEmdbMapping;
    features: Features;
    cv19Tracks: Cv19Tracks;
    pdbAnnotations: PdbAnnotations;
    ebiVariation: EbiVariation;
    coverage: Coverage;
    mobiUniprot: MobiUniprot;
    phosphositeUniprot: PhosphositeUniprot;
    dbPtm: DbPtmAnnotations;
    pfamAnnotations: PfamAnnotations;
    smartAnnotations: SmartAnnotations;
    interproAnnotations: InterproAnnotations;
    proteomics: Proteomics;
    pdbRedo: PdbRedo;
    iedb: IedbAnnotationsResponse;
    pdbExperiment: PdbExperiment;
    elmdbUniprot: ElmdbUniprot;
    molprobity: MolprobityResponse;
    antigenic: AntigenicResponse;
}

type DataRequests = { [K in keyof Data]-?: Future<RequestError, Data[K] | undefined> };

interface Options {
    protein: string;
    pdb: string;
    chain: string;
}

export class ApiPdbRepository implements PdbRepository {
    get(options: Options): FutureData<Pdb> {
        return getData(options).map(data => this.getPdb(data, options));
    }

    getPdb(data: Partial<Data>, options: Options): Pdb {
        debugVariable({ apiData: data });

        const featureFragments = on(data.features, features =>
            getFeatureFragments(options.protein, features)
        );
        const pfamDomainFragments = on(data.pfamAnnotations, pfamAnnotations =>
            getPfamDomainFragments(pfamAnnotations, options.protein)
        );
        const smartDomainFragments = on(data.smartAnnotations, smartAnnotations =>
            getSmartDomainFragments(smartAnnotations, options.protein)
        );
        const interproFragments = on(data.interproAnnotations, interproAnnotations =>
            getInterproDomainFragments(interproAnnotations, options.protein)
        );

        const elmdbFragments = on(data.elmdbUniprot, elmdbUniprot =>
            getElmdbUniprotFragments(elmdbUniprot, options.protein)
        );

        const _variants = on(data.ebiVariation, getVariants);
        const functionalMappingFragments = on(data.cv19Tracks, getFunctionalMappingFragments);
        const structureCoverageFragments = on(data.coverage, getStructureCoverageFragments);

        const emValidationFragments = on(data.pdbAnnotations, getEmValidationFragments);
        const mobiFragments = on(data.mobiUniprot, mobiUniprot =>
            getMobiUniprotFragments(mobiUniprot, options.protein)
        );
        const proteomicsFragments = on(data.proteomics, proteomics =>
            getProteomicsFragments(proteomics, options.protein)
        );
        const pdbRedoFragments = on(data.pdbRedo, pdbRedo =>
            getPdbRedoFragments(pdbRedo, options.chain)
        );
        const epitomesFragments = on(data.iedb, getEpitomesFragments);

        const protein = getProtein(options.protein, data.uniprot);
        const experiment = on(data.pdbExperiment, pdbExperiment =>
            getExperiment(options.pdb, pdbExperiment)
        );

        const phosphiteFragments = on(data.phosphositeUniprot, phosphositeUniprot =>
            getPhosphiteFragments(phosphositeUniprot, options.protein)
        );
        const dbPtmFragments = on(data.dbPtm, dbPtm => getDbPtmFragments(dbPtm, options.protein));

        const molprobityFragments = on(data.molprobity, molprobity =>
            getMolprobityFragments(molprobity, options.chain)
        );

        const antigenFragments = on(data.antigenic, antigenic =>
            getAntigenicFragments(antigenic, options.protein)
        );

        const fragmentsList = [
            featureFragments,
            pfamDomainFragments,
            smartDomainFragments,
            interproFragments,
            functionalMappingFragments,
            structureCoverageFragments,
            mobiFragments,
            elmdbFragments,
            phosphiteFragments,
            dbPtmFragments,
            pdbRedoFragments,
            emValidationFragments,
            molprobityFragments,
            proteomicsFragments,
            epitomesFragments,
            antigenFragments,
        ];

        const tracks = getTracksFromFragments(_(fragmentsList).compact().flatten().value());
        const emdbs = on(data.pdbEmdbMapping, mapping =>
            getEmdbsFromPdbEmdbMapping(mapping, options.pdb)
        );
        debugVariable({ tracks });

        return {
            id: options.pdb,
            emdbs: emdbs || [],
            protein,
            chain: options.chain,
            sequence: data.features ? data.features.sequence : "",
            length: getTotalFeaturesLength(tracks),
            tracks,
            variants: undefined,
            experiment,
        };
    }
}

function getData(options: Options): FutureData<Partial<Data>> {
    const { protein, pdb, chain } = options;
    const { bionotes: bioUrl, ebi: ebiBaseUrl } = routes;
    const ebiProteinsApiUrl = `${ebiBaseUrl}/proteins/api`;
    const pdbAnnotUrl = `${bioUrl}/ws/lrs/pdbAnnotFromMap`;

    // Move URLS to each track module?
    const data$: DataRequests = {
        uniprot: getXML(`https://www.uniprot.org/uniprot/${protein}.xml`),
        pdbEmdbMapping: getJSON(`${bioUrl}/api/mappings/PDB/EMDB/${pdb}`),
        features: getJSON(`${ebiProteinsApiUrl}/features/${protein}`),
        cv19Tracks: getJSON(`${bioUrl}/cv19_annotations/${protein}_annotations.json`),
        pdbAnnotations: getJSON(`${pdbAnnotUrl}/all/${pdb}/${chain}/?format=json`),
        ebiVariation: getJSON(`${ebiProteinsApiUrl}/variation/${protein}`),
        coverage: getJSON(`${bioUrl}/api/alignments/Coverage/${pdb}${chain}`),
        mobiUniprot: getJSON(`${bioUrl}/api/annotations/mobi/Uniprot/${protein}`),
        phosphositeUniprot: getJSON(`${bioUrl}/api/annotations/Phosphosite/Uniprot/${protein}`),
        dbPtm: getJSON(`${bioUrl}/api/annotations/dbptm/Uniprot/${protein}`),
        pfamAnnotations: getJSON(`${bioUrl}/api/annotations/Pfam/Uniprot/${protein}`),
        smartAnnotations: getJSON(`${bioUrl}/api/annotations/SMART/Uniprot/${protein}`),
        interproAnnotations: getJSON(`${bioUrl}/api/annotations/interpro/Uniprot/${protein}`),
        proteomics: getJSON(`${ebiProteinsApiUrl}/proteomics/${protein}`),
        pdbRedo: getJSON(`${bioUrl}/api/annotations/PDB_REDO/${pdb}`),
        iedb: getJSON(`${bioUrl}/api/annotations/IEDB/Uniprot/${protein}`),
        pdbExperiment: getJSON(`${ebiBaseUrl}/pdbe/api/pdb/entry/experiment/${pdb}`),
        elmdbUniprot: getJSON(`${bioUrl}/api/annotations/elmdb/Uniprot/${protein}`),
        molprobity: getJSON(`${bioUrl}/compute/molprobity/${pdb}`),
        antigenic: getJSON(`${ebiProteinsApiUrl}/antigen/${protein}`),
    };

    return Future.joinObj(data$);
}
