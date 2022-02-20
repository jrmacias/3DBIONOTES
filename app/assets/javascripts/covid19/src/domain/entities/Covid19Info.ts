import _ from "lodash";

export interface Covid19Info {
    structures: Structure[];
}

export interface Organism {
    id: string;
    name: string;
    commonName?: string;
    externalLink: Url;
}

export interface Entity {
    id: string;
    uniprotAcc: string | null;
    name: string;
    organism: string;
    details?: string;
    altNames: string;
    isAntibody: boolean;
    isNanobody: boolean;
    isSybody: boolean;
}

export interface Ligand {
    id: string;
    name: string;
    details: string;
    imageLink: Url;
    externalLink: Url;
}

export interface LigandInstance {
    info: Ligand;
    instances: number;
}

export interface Structure {
    id: Id;
    title: string;
    entities: Entity[];
    pdb: Maybe<Pdb>;
    emdb: Maybe<Emdb>;
    organisms: Organism[];
    ligands: Ligand[];
    details: Maybe<string>;
    validations: {
        pdb: PdbValidation[];
        emdb: EmdbValidation[];
    };
}

export interface PdbRedoValidation {
    type: "pdbRedo";
    externalLink: Url;
    queryLink?: Url;
    badgeColor: W3Color;
}

export interface IsoldeValidation {
    type: "isolde";
    queryLink?: Url;
    badgeColor: W3Color;
}

export interface DbItem {
    id: Id;
    method?: string;
    resolution?: string;
    imageUrl: Url;
    externalLinks: Link[];
    queryLink: Url;
}

export interface Link {
    text: string;
    url: string;
    tooltip?: string;
}

export type W3Color = "w3-cyan" | "w3-turq";
export type PdbValidation = PdbRedoValidation | IsoldeValidation;
export type EmdbValidation = "DeepRes" | "MonoRes" | "Map-Q" | "FSC-Q";

export interface Pdb extends DbItem {
    keywords: string;
    entities: Entity[];
    ligands: string[];
}

export interface Emdb extends DbItem {
    emMethod: string;
}

export interface Validation {
    externalLink?: Url[];
    queryLink: Url[];
    badgeColor: string;
}

export type Id = string;

export type Dictionary<T> = Record<Id, T>;

export type Maybe<T> = T | undefined | null;

export type Url = string;

export type Ref = { id: Id };

export interface Covid19Filter {
    [x: string]: boolean;
}

/*
    antibodies: boolean;
    nanobodies: boolean;
    sybodies: boolean;
    pdbRedo: boolean;
*/

export function filterEntities(entities: Entity[], filterState: Covid19Filter): Entity[] {
    return entities.filter(
        entity =>
            entity.isAntibody === filterState.antibodies &&
            entity.isNanobody === filterState.nanobodies &&
            entity.isSybody === filterState.sybodies
    );
}

export function buildPdbRedoValidation(pdbId: Id): PdbRedoValidation {
    const pdbRedoUrl = `https://pdb-redo.eu/db/${pdbId.toLowerCase()}`;

    return {
        type: "pdbRedo",
        externalLink: pdbRedoUrl,
        queryLink: `/pdb_redo/${pdbId}`,
        badgeColor: "w3-turq",
    };
}

export function addPdbValidationToStructure(
    structure: Structure,
    validation: PdbValidation
): Structure {
    const existingValidations = structure.validations.pdb;
    const structureContainsValidation = _(existingValidations).some(existingValidation =>
        _.isEqual(existingValidation, validation)
    );

    if (!structureContainsValidation) {
        const pdbValidations = _.concat(existingValidations, [validation]);

        return {
            ...structure,
            validations: { ...structure.validations, pdb: pdbValidations },
        };
    } else {
        return structure;
    }
}
