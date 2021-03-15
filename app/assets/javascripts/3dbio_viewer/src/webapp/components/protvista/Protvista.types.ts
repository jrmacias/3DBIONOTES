import React from "react";
import { Color } from "../../../domain/entities/Color";
import { Pdb } from "../../../domain/entities/Pdb";
import { Shape } from "../../../domain/entities/Shape";
import { Variant, Variants } from "../../../domain/entities/Variant";
import { SelectionState } from "../../view-models/SelectionState";
import { ViewerBlockModel } from "../ViewerBlock";

export interface ProtvistaTrackElement extends HTMLDivElement {
    viewerdata: PdbView;
    layoutHelper: {
        hideSubtracks(index: number): void;
    };
}

export interface ComponentProps {
    pdb: Pdb;
    selection: SelectionState;
}

export interface BlockDef extends ViewerBlockModel {
    tracks: TrackDef[];
    component?: React.FC<ComponentProps>;
}

export interface ProtvistaBlock extends ViewerBlockModel {
    tracks: TrackDef[];
    component?: React.FC<ComponentProps>;
}

export interface TrackDef {
    id: string;
    name: string;
    description?: string;
    subtracks: SubtrackDef[];
    component?: React.FC<ComponentProps>;
}

export interface SubtrackDef {
    id: string;
    name: string;
    source: string;
    description?: string;
}

// https://github.com/ebi-webcomponents/nightingale/tree/master/packages/protvista-track

export interface PdbView {
    displayNavigation: boolean;
    displaySequence: boolean;
    displayConservation: boolean;
    displayVariants: boolean;
    offset?: number;
    legends?: {
        alignment: "left" | "right" | "center";
        data: Record<string, Array<{ color: Color[]; text: string }>>;
    };
    sequence: string;
    length: number;
    tracks: TrackView[];
    variants?: VariantsView;
    sequenceConservation?: unknown;
}

interface VariantsView extends Variants {
    variants: VariantView[];
}

export interface VariantView extends Variant {
    tooltipContent: string;
}

export interface TrackView {
    label: string;
    help: string;
    labelType?: "text" | "html";
    overlapping?: boolean;
    data: SubtrackView[];
}

interface SubtrackView {
    accession: string;
    type: string; // Displayed in tooltip title
    label: string; // Supports: text and html.
    labelTooltip: string; // Label tooltip content. Support text and HTML mark-up
    overlapping?: boolean;
    shape: Shape;
    locations: Array<{ fragments: FragmentView[] }>;
    help: string;
}

export interface FragmentView {
    start: number;
    end: number;
    color: Color;
    tooltipContent: string;
}
