import React from "react";
import i18n from "../../utils/i18n";
import { Dropdown, DropdownProps } from "../dropdown/Dropdown";
import { Network } from "../network/Network";
import { useBooleanState } from "../../hooks/use-boolean";
import { sendAnalytics } from "../../utils/analytics";
import { AnnotationsTool } from "../annotations-tool/AnnotationsTool";
import { Annotations } from "../../../domain/entities/Annotation";
import { Build as BuildIcon } from "@material-ui/icons";

export interface ToolsButtonProps {
    onAddAnnotations(annotations: Annotations): void;
    expanded: boolean;
}

type ItemId = "custom-annotations" | "network";

type Props = DropdownProps<ItemId>;

export const ToolsButton: React.FC<ToolsButtonProps> = ({ onAddAnnotations, expanded }) => {
    const [isNetworkOpen, { open: openNetwork, close: closeNetwork }] = useBooleanState(false);
    const [isAnnotationToolOpen, annotationToolActions] = useBooleanState(false);

    const items = React.useMemo<Props["items"]>(() => {
        return [
            { text: i18n.t("Upload custom annotations"), id: "custom-annotations" },
            { text: i18n.t("Network"), id: "network" },
        ];
    }, []);

    const openNetworkWithAnalytics = React.useCallback(() => {
        openNetwork();
        sendAnalytics("open_dialog", {
            label: "Network",
        });
    }, [openNetwork]);

    const openMenuItem = React.useCallback<Props["onClick"]>(
        itemId => {
            switch (itemId) {
                case "custom-annotations":
                    return annotationToolActions.open();
                case "network":
                    return openNetworkWithAnalytics();
            }
        },
        [annotationToolActions, openNetworkWithAnalytics]
    );

    return (
        <>
            <Dropdown<ItemId>
                text={(expanded && i18n.t("Tools")) || undefined}
                items={items}
                onClick={openMenuItem}
                leftIcon={<BuildIcon fontSize="small" />}
            />

            {isNetworkOpen && <Network onClose={closeNetwork} />}

            {isAnnotationToolOpen && (
                <AnnotationsTool onClose={annotationToolActions.close} onAdd={onAddAnnotations} />
            )}
        </>
    );
};
