import React from "react";
import i18n from "../../../../utils/i18n";
import { BadgeLigands } from "../badge/BadgeLigands";
import { CellProps, styles } from "../Columns";
import { Link } from "../Link";
import { Wrapper } from "./Wrapper";

export const LigandsCell: React.FC<CellProps> = React.memo(props => {
    const { row, onClickDetails, onClickLigands, moreDetails } = props;

    const ligands = React.useMemo(() => {
        return row.ligands.map(ligand => {
            return {
                ...ligand,
                url: ligand.externalLink,
                tooltip: (
                    <React.Fragment>
                        <div>
                            {i18n.t("ID")}: {ligand.id}
                        </div>
                        <div>
                            {i18n.t("Name")}: {ligand.name}
                        </div>

                        {ligand.details !== ligand.name && (
                            <div>
                                {i18n.t("Details")}: {ligand.details}
                            </div>
                        )}

                        {ligand.imageLink && (
                            <img alt={ligand.id} src={ligand.imageLink} style={styles.image} />
                        )}
                    </React.Fragment>
                ),
            };
        });
    }, [row.ligands]);

    return (
        <Wrapper
            onClickDetails={onClickDetails}
            moreDetails={moreDetails}
            row={row}
            field="ligands"
        >
            {ligands.map(ligand => (
                <div key={ligand.id}>
                    <Link
                        tooltip={ligand.tooltip}
                        url={ligand.url}
                        text={`${ligand.name} (${ligand.id})`}
                    />
                    <div>
                        <BadgeLigands ligand={ligand} onClick={onClickLigands} />
                    </div>
                </div>
            ))}
        </Wrapper>
    );
});
