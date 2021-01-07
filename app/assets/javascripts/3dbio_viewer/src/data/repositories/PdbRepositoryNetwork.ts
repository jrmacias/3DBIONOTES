import _ from "lodash";
import { AxiosRequestConfig } from "axios";
import { FutureData } from "../../domain/entities/FutureData";
import { Pdb } from "../../domain/entities/Pdb";
import { Variant, VariantFilter, Variants } from "../../domain/entities/Variant";
import { PdbRepository } from "../../domain/repositories/PdbRepository";
import { Future } from "../../utils/future";
import { AxiosBuilder, axiosRequest } from "../../utils/future-axios";
import protvistaConfig, { VariantFilterType } from "../../webapp/components/protvista/protvista-config";
import { Track } from "../../domain/entities/Track";
import { Fragment } from "../../domain/entities/Fragment";

function getJson<Data>(url: string): Future<RequestError, Data> {
    return request<Data>({ method: "GET", url });
}

interface Data {
    features: Features;
    annotations: Cv19Annotations;
    ebiVariation: EbiVariation;
    pdbAnnotations: PdbAnnotations;
    bioMuta: EbiVariation;
}

type AsyncData = { [K in keyof Data]: Future<RequestError, Data[K]> };

type RequestError = { message: string };

const builder: AxiosBuilder<RequestError> = {
    mapResponse: res => {
        if (res.status >= 200 && res.status < 300) {
            return ["success", res.data];
        } else {
            return ["error", { message: JSON.stringify(res.data) }];
        }
    },
    mapNetworkError: (_req, message) => ({ status: 0, message }),
};

function request<Data>(request: AxiosRequestConfig): Future<RequestError, Data> {
    return axiosRequest<RequestError, Data>(builder, request);
}

export class PdbRepositoryNetwork implements PdbRepository {
    get(options: { protein: string; pdb: string; chain: string }): FutureData<Pdb> {
        const { protein, pdb, chain } = options;

        // [featuresData, annotations, ebiVariation, pdbAnnotations, bioMuta]
        const data$: AsyncData = {
            features: getJson(`https://www.ebi.ac.uk/proteins/api/features/${protein}`),
            annotations: getJson(
                `http://3dbionotes.cnb.csic.es/cv19_annotations/${protein}_annotations.json`
            ),
            ebiVariation: getJson(`https://www.ebi.ac.uk/proteins/api/variation/${protein}`),
            pdbAnnotations: getJson(
                `http://3dbionotes.cnb.csic.es/ws/lrs/pdbAnnotFromMap/all/${pdb}/${chain}/?format=json`
            ),
            bioMuta: getJson(
                `http://3dbionotes.cnb.csic.es/api/annotations/biomuta/Uniprot/${protein}`
            ),
        };

        const data1$ = Future.join(data$.features, data$.annotations);
        const data2$ = Future.join3(data$.ebiVariation, data$.pdbAnnotations, data$.bioMuta);

        return Future.join(data1$, data2$).map(
            ([[features, annotations], [ebiVariation, pdbAnnotations, bioMuta]]) => {
                //if (!featuresData) throw new Error("TODO: No features data");
                return this.getPdb({
                    features,
                    annotations,
                    ebiVariation,
                    pdbAnnotations,
                    bioMuta,
                });
            }
        );
    }

    getPdb(data: Data): Pdb {
        const { features: featuresData, annotations, ebiVariation, pdbAnnotations, /* bioMuta */ } = data;

        const filters: VariantFilter[] = protvistaConfig.variantsFilters.map(
            (f, idx): VariantFilter => ({
                name: "filter-" + idx,
                type: {
                    name: f.type === "source" ? ("provenance" as const) : ("consequence" as const),
                    text: textByVariantFilterType[f.type],
                },
                options: {
                    labels: f.items.map(item => item.label),
                    colors: f.items.map(item => item.color),
                },
            })
        );

        const variants: Variants | undefined = ebiVariation
            ? {
                  sequence: ebiVariation.sequence,
                  filters,
                  variants: ebiVariation.features.map(
                      (v): Variant => ({
                          accession: v.genomicLocation, // "NC_000021.9:g.26170608A>C";
                          color: "#800",
                          start: v.begin,
                          end: v.end,
                          //polyphenScore: number,
                          //siftScore: number,
                          sourceType: v.sourceType, //"large_scale_study";
                          // TODO
                          tooltipContent:
                              "<table>\n            <tr>\n                <td>Variant</td>\n                <td>L > V</td>\n            </tr>\n            \n            \n        <tr>\n            <td>SIFT</td>\n            <td>0.215</td>\n        </tr>\n        \n            \n        <tr>\n            <td>Polyphen</td>\n            <td>0.003</td>\n        </tr>\n        \n            \n            \n        <tr>\n            <td>Consequence</td>\n            <td>missense</td>\n        </tr>\n        \n            \n            \n            \n            <tr>\n                <td>Location</td>\n                <td>NC_000021.9:g.26170608A>C</td>\n            </tr>\n            \n            \n            \n        </table>",
                          variant: v.alternativeSequence, // "V";
                          xrefNames: (v.xrefs || []).map(xref => xref.name), // ["gnomAD", "TOPMed"];
                          //keywords: string[], // ["large_scale_studies", "predicted"];
                      })
                  ),
              }
            : undefined;

        const mapping = annotations ? annotations[0] : undefined;

        const mappingTracks = mapping
            ? _(mapping.data)
                  .groupBy(data => data.partner_name)
                  .map((values, key) => ({ name: key, items: values }))
                  .value()
            : [];

        const featuresByCategory = featuresData
            ? _(featuresData.features)
                  .groupBy(data => data.category)
                  .mapValues(values =>
                      _(values)
                          .groupBy(value => value.type)
                          .map((values, key) => ({ name: key, items: values }))
                          .value()
                  )
                  .value()
            : {};

        const features = _(protvistaConfig.categories)
            .map(category => {
                const items = featuresByCategory[category.name];
                return items ? { name: category.label, items } : null;
            })
            .compact()
            .value();

        const functionalMappingTrack: Track | undefined = mapping
            ? {
                  label: getName(mapping.track_name),
                  labelType: "text",
                  overlapping: false,
                  data: mappingTracks.map(track => ({
                      accession: getName(track.name),
                      type: track.items[0].type, // TODO
                      label: getName(track.name),
                      labelTooltip: track.items[0].description, // TODO
                      overlapping: false,
                      shape: "rectangle",
                      locations: [
                          {
                              fragments: track.items.map(item => ({
                                  start: item.begin,
                                  end: item.end,
                                  tooltipContent: item.description, // TODO: more
                                  color: item.color,
                              })),
                          },
                      ],
                  })),
              }
            : undefined;

        const emValidationTrack: Track | undefined = pdbAnnotations
            ? {
                  label: "em validation",
                  labelType: "text",
                  overlapping: false,
                  data: pdbAnnotations.map((pdbAnnotation: PdbAnnotation) => ({
                      accession: pdbAnnotation.algorithm,
                      type: "some-type", // TODO
                      label: getName(
                          `${pdbAnnotation.algorithm} (${pdbAnnotation.minVal} -> ${pdbAnnotation.maxVal})`
                      ),
                      labelTooltip: `${pdbAnnotation.algorithm} (${pdbAnnotation.minVal} -> ${pdbAnnotation.maxVal})`,
                      overlapping: false,
                      shape: "rectangle",
                      locations: [
                          {
                              fragments: pdbAnnotation.data.map(obj => ({
                                  start: parseInt(obj.begin),
                                  end: parseInt(obj.begin),
                                  tooltipContent: "Contents: TODO",
                                  color: "#BA4", // TODO: Color from obj.value, see legend in extendProtVista/add_em_res.js
                              })),
                          },
                      ],
                  })),
              }
            : undefined;

        const tracks: Track[] = _.compact([
            functionalMappingTrack,
            ...features.map(feature => ({
                label: feature.name,
                labelType: "text" as const,
                overlapping: false,
                data: feature.items.map((item, idx) => ({
                    accession: item.name + "-" + idx,
                    type: getName(item.name),
                    label:
                        protvistaConfig.tracks[item.name.toLowerCase()]?.label ||
                        getName(item.name),
                    labelTooltip:
                        protvistaConfig.tracks[item.name.toLowerCase()]?.tooltip ||
                        getName(item.name),
                    overlapping: false,
                    shape: protvistaConfig.shapeByTrackName[item.name.toLowerCase()] || "circle",
                    locations: [
                        {
                            fragments: item.items.map(
                                (item): Fragment => ({
                                    start: parseInt(item.begin),
                                    end: parseInt(item.end),
                                    tooltipContent: item.description, // TODO: more
                                    color:
                                        protvistaConfig.tracks[item.type.toLowerCase()]?.color ||
                                        "#777",
                                })
                            ),
                        },
                    ],
                })),
            })),
            emValidationTrack,
        ]);

        return {
            sequence: featuresData.sequence,
            tracks,
            variants,
            length:
                _(features)
                    .flatMap(feature => feature.items)
                    .flatMap(item => item.items)
                    .map(item => parseInt(item.end))
                    .max() || 0,
        };
    }
}

interface EbiVariation {
    accession: string; // "P0DTC2";
    entryName: string; // "SPIKE_SARS2";
    proteinName: string; //"Spike glycoprotein";
    geneName: string; // "S";
    organismName: string; // "Severe acute respiratory syndrome coronavirus 2";
    proteinExistence: string; //"Evidence at protein level";
    sequence: string; //"MFVFL";
    sequenceChecksum: string; //"12789069390587161140";
    sequenceVersion: number; // 1
    taxid: number; // 2697049;
    features: EbiVariationFeature[];
}

interface EbiVariationFeature {
    type: "VARIANT";
    alternativeSequence: string; //"L",
    begin: string; //"2",
    end: string; // "2",
    xrefs?: Array<{
        name: string; // "ENA",
        id: string; // "MN908947.3:21568:T:A"
    }>;
    genomicLocation: string; //"NC_045512.2:g.21568T>A";
    locations: Array<{
        loc: string; // "p.Phe2Leu";
        seqId: string; // "ENSSAST00005000004";
        source: string; // "EnsemblViruses";
    }>;
    codon: string; // "TTT/TTA";
    consequenceType: "missense" | "stop gained";
    wildType: string; //"F";
    mutatedType: string; // "L";
    somaticStatus: number; // 0;
    sourceType: string; // "large_scale_study";
}

const textByVariantFilterType: Record<VariantFilterType, string> = {
    consequence: "Filter consequence",
    source: "Filter data source",
};

interface Features {
    accession: string;
    entryName: string;
    sequence: string;
    sequenceChecksum: string;
    taxid: number;
    features: Feature[];
}

interface Feature {
    type: string;
    category: string;
    description: string;
    begin: string;
    end: string;
    molecule: string;
    evidences: Array<{
        code: string;
        source: { name: string; id: string; url: string; alternativeUrl?: string };
    }>;
}

type Cv19Annotations = Cv19Annotation[];

interface Cv19Annotation {
    track_name: string;
    visualization_type?: "variants"; // This type uses a different Data, implement if necessary
    acc: string;
    data: Cv19AnnotationData[];
    reference: string;
    fav_icon: string;
}

interface Cv19AnnotationData {
    begin: number;
    end: number;
    partner_name: string;
    color: string;
    description: string;
    type: string;
}

type PdbAnnotations = PdbAnnotation[];

interface PdbAnnotation {
    chain: string;
    minVal: number;
    maxVal: number;
    algorithm: string;
    algoType: string;
    data: Array<{ begin: string; value: number }>;
}

function getName(s: string) {
    //return _.capitalize(s.replace(/_/g, " "));
    return s.replace(/_/g, " ");
}