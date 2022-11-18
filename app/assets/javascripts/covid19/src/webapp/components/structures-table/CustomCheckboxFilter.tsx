import _ from "lodash";
import React from "react";
import styled from "styled-components";
import FilterListIcon from "@material-ui/icons/FilterList";
import { MenuItem, MenuList, Divider, Checkbox, Button } from "@material-ui/core";
import { GridMenu } from "@material-ui/data-grid";
import {
    Covid19Filter,
    FilterKey,
    getTranslations,
    getValidationSource,
    Maybe,
    ValidationSource,
} from "../../../domain/entities/Covid19Info";
import { HtmlTooltip } from "./HtmlTooltip";
import i18n from "../../../utils/i18n";

export interface CustomCheckboxFilterProps {
    setFilterState: (value: React.SetStateAction<Covid19Filter>) => void;
    validationSources: ValidationSource[];
}

export const CustomCheckboxFilter: React.FC<CustomCheckboxFilterProps> = React.memo(props => {
    const { setFilterState, validationSources } = props;
    const [anchorEl, setAnchorEl] = React.useState(null);
    const isOpen = Boolean(anchorEl);
    const openMenu = React.useCallback(event => setAnchorEl(event.currentTarget), []);
    const closeMenu = React.useCallback(() => setAnchorEl(null), []);
    const startIcon = React.useMemo(() => <FilterListIcon />, []);

    const getTooltip = React.useCallback(
        (source: Maybe<ValidationSource>) =>
            source ? (
                <div>
                    {source.methods.map(method => (
                        <>
                            {source.methods.length > 1 ? (
                                <strong>
                                    {i18n.t(`{{methodName}} Method: `, {
                                        nsSeparator: false,
                                        methodName: method.name,
                                    })}
                                </strong>
                            ) : (
                                <strong>{i18n.t("Method: ", { nsSeparator: false })}</strong>
                            )}
                            <span>{method.description}</span>
                            <br />
                            <br />
                        </>
                    ))}
                    {source.description && (
                        <>
                            <strong>{i18n.t("Source: ", { nsSeparator: false })}</strong>
                            <span>{source.description}</span>
                        </>
                    )}
                </div>
            ) : undefined,
        []
    );

    const pdbTooltip = React.useMemo(
        () => getTooltip(getValidationSource(validationSources, "PDB-REDO")),
        [validationSources, getTooltip]
    );
    const cstfTooltip = React.useMemo(
        () => getTooltip(getValidationSource(validationSources, "CSTF")),
        [validationSources, getTooltip]
    );
    const ceresTooltip = React.useMemo(
        () => getTooltip(getValidationSource(validationSources, "CERES")),
        [validationSources, getTooltip]
    );

    return (
        <React.Fragment>
            <FilterButton
                color="primary"
                onClick={openMenu}
                aria-expanded={Boolean(anchorEl)}
                aria-label="toolbarExportLabel"
                aria-haspopup="menu"
                endIcon={startIcon}
            >
                {i18n.t("Filter")}
            </FilterButton>

            <GridMenu
                open={isOpen}
                target={anchorEl}
                onClickAway={closeMenu}
                position="bottom-start"
            >
                <MenuList className="MuiDataGrid-gridMenuList" autoFocusItem={isOpen}>
                    <FilterItem filterKey="antibodies" setFilterState={setFilterState} />
                    <FilterItem filterKey="nanobodies" setFilterState={setFilterState} />
                    <FilterItem filterKey="sybodies" setFilterState={setFilterState} />
                    <Divider />
                    <FilterItem
                        filterKey="pdbRedo"
                        setFilterState={setFilterState}
                        tooltip={pdbTooltip}
                    />
                    <FilterItem
                        filterKey="cstf"
                        setFilterState={setFilterState}
                        tooltip={cstfTooltip}
                    />
                    <FilterItem
                        filterKey="ceres"
                        setFilterState={setFilterState}
                        tooltip={ceresTooltip}
                    />
                    <Divider />
                    <FilterItem filterKey="idr" setFilterState={setFilterState} />
                </MenuList>
            </GridMenu>
        </React.Fragment>
    );
});

const FilterItem: React.FC<FilterItemProps> = React.memo(props => {
    const { filterKey, setFilterState, tooltip } = props;
    const [open, setOpen] = React.useState(false);
    const [checked, setChecked] = React.useState(false);

    const handleClick = React.useCallback(() => {
        setFilterState(filterState => ({
            ...filterState,
            [filterKey]: !checked,
        }));
        setChecked(!checked);
    }, [setFilterState, filterKey, checked, setChecked]);

    const closeTooltip = React.useCallback(() => {
        setOpen(false);
    }, []);

    const openTooltip = React.useCallback(() => {
        setOpen(true);
    }, []);

    const t = React.useMemo(getTranslations, []);
    const component = React.useMemo(
        () => (
            <MenuItem onMouseEnter={openTooltip} onMouseLeave={closeTooltip} onClick={handleClick}>
                <StyledCheckbox checked={checked} onClick={handleClick} name={filterKey} />
                {t.filterKeys[filterKey]}
            </MenuItem>
        ),
        [filterKey, handleClick, t, closeTooltip, openTooltip, checked]
    );

    return tooltip ? (
        <HtmlTooltip title={tooltip} open={open}>
            {component}
        </HtmlTooltip>
    ) : (
        <>{component}</>
    );
});

interface FilterItemProps {
    filterKey: FilterKey;
    setFilterState: (value: React.SetStateAction<Covid19Filter>) => void;
    tooltip?: React.ReactNode;
}

const StyledCheckbox = styled(Checkbox)`
    &.MuiCheckbox-colorSecondary.Mui-checked {
        color: #484848;
    }
    padding: 0 8px 0 0 !important;
`;

const FilterButton = styled(Button)`
    &.MuiButton-root {
        padding: 6px 16px;
        margin: auto 5px auto 10px;
        color: #fff;
        height: 45px;
        font-weight: 500;
        text-align: center;
        border-radius: 0.75rem;
        background-color: #607d8b;
        border-color: #607d8b;
        font-size: 0.875rem;
        line-height: 45px;
        &:focus {
            outline: none;
        }
        &:hover {
            border-color: #82a4b5;
            background-color: #82a4b5;
        }
    }
`;
