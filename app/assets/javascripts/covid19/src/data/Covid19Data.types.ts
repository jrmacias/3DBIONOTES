export interface Covid19Data {
    Organisms: Organism[];
    Ligands: Ligand[];
    Structures: Array<Structure[]>;
}

export interface Organism {
    ncbi_taxonomy_id: string;
    common_name?: string;
    scientific_name: string;
    externalLink: Url;
}

export interface Entity {
    uniprotAcc: Maybe<string>;
    name: string;
    organism: string;
    details: string;
    altNames: string;
    isAntibody: boolean;
    isNanobody: boolean;
    isSybody: boolean;
}

export interface Ligand {
    dbId: LigandId;
    name: string;
    details: string;
    imageLink: Url;
    externalLink: Url;
}

export interface Structure {
    title: string;
    pdb: Maybe<Pdb>;
    emdb: Maybe<Emdb>;
}

export interface DbItem {
    dbId: string;
    method?: string;
    resolution?: string;
    imageLink?: Url;
    externalLink: Url;
    queryLink: Url;
}

export interface Pdb extends DbItem {
    keywords: string;
    entities: Entity[];
    ligands: LigandId[];
    details?: Details[];
}

export interface Emdb extends DbItem {
    emMethod: string;
}

type Maybe<T> = T | null;

type LigandId = string;

export type EntityRef = { organism?: string; uniprotAcc?: string };

export type Url = string;



type Author = String;
export interface RefDB {
    title: string;
    authors: Author[];
    deposited?: string;
    released?: string;
}
export interface RefEMDB extends RefDB {
}
export interface RefPDB {
}
export interface RefDoc {
    pmID: string;
    title: string;
    authors: Author[];
    abstract?: string;
    journal: string;
    pubDate: string;
    pmidLink?: URL;
    doi?: URL;
}
export interface Sample {
    name: string;
    exprSystem?: string;
    assembly?: string;
    macromolecules?: string[];
    uniProts?: string[];
    genes?: string[];
    bioFunction?: string[];
    bioProcess?: string[];
    cellComponent?: string[];
    domains?: string[];

}
export interface Details {
    refEMDB?: RefEMDB;
    refPDB?: RefPDB;
    sample?: Sample;
    refdoc?: RefDoc[];
}