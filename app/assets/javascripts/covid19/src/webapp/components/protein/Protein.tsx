import React, { useEffect, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
    DataGridProps,
} from "@material-ui/data-grid";
import axios, { AxiosResponse } from "axios";
import {
    Covid19Data,
    RowUpload,
    ItemDetails,
    PdbApiResponse,
    EmdbApiResponse,
} from "../../../domain/entities/Covid19Data";
import styled from "styled-components";
import { columnSettings } from "../app/ColumnSettings";
import _ from "lodash";

interface ProteinProps {
    protein: Covid19Data["proteins"][number];
}

export const Badge = styled.span`
    padding: 6px 12px;
    font-size: 10.5px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    margin: 2px 0px;
    white-space: normal;
    color: #fff;
    color: #fff;
    background-color: #007bff;
    display: inline-block;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
    vertical-align: baseline;
    border-radius: 0.25rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
        border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
`;

const ProteinHeader = styled.div`
    margin: 20px 0 20px;
    padding: 0;
    box-shadow: 0 0px 10px rgb(0 0 0 / 3%), 0 0px 23px rgb(0 0 0 / 4%);
    border-left: 100% solid #607d8b;
`;

const ProteinName = styled.p`
    margin: 5px 0 8px;
    color: #484848;
    font-weight: bold;
`;
const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarExport />
    </GridToolbarContainer>
);

export const Protein: React.FC<ProteinProps> = props => {
    const { protein } = props;
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(2); // 50
    const [details, setDetails] = React.useState<Record<number, ItemDetails>>({});
    const setFirstPage = React.useCallback(() => setPage(0), [setPage]);

    const items = React.useMemo(() => {
        return protein.sections.flatMap(section => {
            if (section.subsections.length !== 0) {
                const itemsToPush = section.items;
                const subsectionItems = section.subsections.flatMap(subsection =>
                    subsection.items.map(item =>
                        section.name === "Related"
                            ? { relatedType: subsection.name, ...item }
                            : section.name === "Computational Models"
                            ? { computationalModel: subsection.name, ...item }
                            : item
                    )
                );

                return itemsToPush.concat(subsectionItems);
            } else {
                return section.items;
            }
        });
    }, [protein.sections]);

    const getDetailsData = useCallback(async (items: RowUpload[]) => {
        try {
            const promises = items.map(item => {
                const { api: url, id } = item;
                return url !== undefined && id !== undefined
                    ? axios.get(url).then((resp: AxiosResponse<any>) => ({
                          id,
                          value: Object.values(resp.data).flatMap(data => data)[0] as
                              | PdbApiResponse
                              | EmdbApiResponse,
                      }))
                    : null;
            });
            const res0 = await Promise.all(_.compact(promises));
            const newRows = res0.map(({ id, value }) => {
                const det = {
                    description:
                        (value as PdbApiResponse)?.title ||
                        (value as EmdbApiResponse)?.deposition?.title,
                    authors:
                        (value as PdbApiResponse)?.entry_authors?.join(" , ") ||
                        (value as EmdbApiResponse)?.deposition?.authors,
                    released:
                        (value as PdbApiResponse)?.release_date ||
                        (value as EmdbApiResponse)?.deposition?.deposition_date,
                };
                return [id, det] as [number, ItemDetails];
            });
            setDetails(_.fromPairs(newRows));
        } catch {
            throw Error("Promise failed");
        }
    }, []);

    const rows = React.useMemo(() => {
        return items.map(
            (item, index): RowUpload => {
                item.links.map(link => {
                    if (link.title === "PDB-Redo") {
                        item["pdb_redo"] = link;
                    }
                    if (link.title === "Isolde") {
                        item["isolde"] = link;
                    }
                    if (link.title === "Refmac") {
                        item["refmac"] = link;
                    }
                    return item;
                });

                return {
                    id: index,
                    ...item,
                    title: "",
                    pdb: item.type === "pdb" ? item.name : undefined,
                    emdb: item.type === "emdb" ? item.name : undefined,
                    details: {
                        description: "",
                        authors: [],
                        released: "",
                    },
                };
            }
        );
    }, [items]);

    const [renderedRows, setRenderedRows] = React.useState<RowUpload[]>([]);

    const loadDetails = React.useCallback<NonNullable<DataGridProps["onStateChange"]>>(
        gridParams => {
            const { api } = gridParams;
            const { page, pageSize } = gridParams.state.pagination;
            const sortedIds = api.getSortedRowIds() as number[];
            const visibleIds = Array.from(api.getVisibleRowModels().keys()) as number[];
            const ids = _(sortedIds)
                .intersection(visibleIds)
                .drop(page * pageSize)
                .take(pageSize)
                .value();

            //console.debug("loadDetails", { page }, "->", { ids });

            const newRenderedRows = _(gridParams.state.rows.idRowsLookup).at(ids).compact().value();

            setRenderedRows(prevRenderedRows => {
                const prevIds = prevRenderedRows.map(x => x.id);
                return _.isEqual(prevIds, ids) ? prevRenderedRows : newRenderedRows;
            });
        },
        []
    );

    useEffect(() => {
        getDetailsData(renderedRows);
    }, [getDetailsData, renderedRows]);

    const classes = useStyles();

    const rowsWithDetails = React.useMemo(
        () =>
            rows.map(row => {
                const det = details && row.id !== undefined ? details[row.id] : null;
                return det ? { ...row, title: det.description, details: det } : row;
            }),
        [rows, details]
    );

    return (
        <ProteinHeader>
            <div style={{ padding: 16 }}>
                <Badge
                    style={{
                        fontSize: 14,
                        backgroundColor: "#00bcd4",
                        borderColor: "#00bcd4",
                    }}
                >
                    <strong>{protein.name}</strong>
                </Badge>

                {protein.polyproteins.map((polyprotein, index) => (
                    <Badge
                        key={index}
                        style={{
                            fontSize: 14,
                            backgroundColor: "#607d8b",
                            borderColor: "#607d8b",
                            marginLeft: 5,
                        }}
                    >
                        {polyprotein}
                    </Badge>
                ))}
                <ProteinName>{protein.names.join(" | ")}</ProteinName>

                <p>
                    <i>{protein.description}</i>
                </p>

                <div style={{ display: "flex", height: "100%" }}>
                    <div style={{ flexGrow: 1 }}>
                        <DataGrid
                            page={page}
                            onStateChange={loadDetails}
                            className={classes.root}
                            rowHeight={150}
                            onSortModelChange={setFirstPage}
                            sortingOrder={["asc", "desc"]}
                            rows={rowsWithDetails}
                            autoHeight
                            columns={columnSettings}
                            components={{
                                Toolbar: CustomToolbar,
                            }}
                            disableColumnMenu={true}
                            pageSize={pageSize}
                            onPageChange={params => {
                                setPage(params.page);
                            }}
                            onPageSizeChange={params => {
                                setPageSize(params.pageSize);
                            }}
                            pagination
                            rowsPerPageOptions={[25, 50, 75, 100]}
                        />
                    </div>
                </div>
            </div>
        </ProteinHeader>
    );
};

const useStyles = makeStyles({
    root: {
        "&.MuiDataGrid-root .MuiDataGrid-cell": {
            whiteSpace: "normal",
            display: "flex", // "block" for non-vertically-centered text
        },
        "&.MuiDataGrid-root .MuiDataGrid-cellWithRenderer": {},
    },
});
