import { AbstractMesh, Mesh, IExplorerExtensibilityGroup } from "babylonjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { faVectorSquare } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface IMeshTreeItemComponentProps {
    mesh: AbstractMesh,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class MeshTreeItemComponent extends React.Component<IMeshTreeItemComponentProps, { isGizmoEnabled: boolean, isVisible: boolean }> {
    constructor(props: IMeshTreeItemComponentProps) {
        super(props);

        const mesh = this.props.mesh;

        this.state = { isGizmoEnabled: mesh.reservedDataStore && mesh.reservedDataStore.gizmo, isVisible: this.props.mesh.isVisible }
    }

    showGizmos(): void {
        const mesh = this.props.mesh;

        if (!this.state.isGizmoEnabled) {

            if (!mesh.reservedDataStore) {
                mesh.reservedDataStore = {};
            }
            mesh.reservedDataStore.previousParent = mesh.parent;

            if (mesh.reservedDataStore.previousParent) {
                if (!mesh.reservedDataStore.previousParent.reservedDataStore) {
                    mesh.reservedDataStore.previousParent.reservedDataStore = {};
                }

                if (!mesh.reservedDataStore.previousParent.reservedDataStore.detachedChildren) {
                    mesh.reservedDataStore.previousParent.reservedDataStore.detachedChildren = [];
                }

                mesh.reservedDataStore.previousParent.reservedDataStore.detachedChildren.push(mesh);
            }

            // Connect to gizmo
            const dummy = BABYLON.BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(mesh as Mesh);
            dummy.reservedDataStore = { hidden: true };
            const gizmo = new BABYLON.BoundingBoxGizmo(BABYLON.Color3.FromHexString("#0984e3"));
            gizmo.attachedMesh = dummy;

            gizmo.updateBoundingBox();

            gizmo.fixedDragMeshScreenSize = true;
            mesh.reservedDataStore.gizmo = gizmo;

            var pointerDragBehavior = new BABYLON.PointerDragBehavior();
            pointerDragBehavior.useObjectOrienationForDragging = false;

            dummy.addBehavior(pointerDragBehavior);

            mesh.reservedDataStore.pointerDragBehavior = pointerDragBehavior;
            mesh.reservedDataStore.dummy = dummy;

            this.setState({ isGizmoEnabled: true });
            return;
        }

        const previousParent = mesh.reservedDataStore.previousParent;
        mesh.removeBehavior(mesh.reservedDataStore.pointerDragBehavior);
        mesh.reservedDataStore.gizmo.dispose();
        mesh.reservedDataStore.gizmo = null;
        mesh.setParent(previousParent);
        mesh.reservedDataStore.dummy.dispose();
        mesh.reservedDataStore.dummy = null;

        if (previousParent && previousParent.reservedDataStore) {
            previousParent.reservedDataStore.detachedChildren = null;
        }

        mesh.reservedDataStore.previousParent = null;
        mesh.reservedDataStore.pointerDragBehavior = null;

        this.setState({ isGizmoEnabled: false });
    }

    switchVisibility(): void {
        const newState = !this.state.isVisible;
        this.setState({ isVisible: newState });
        this.props.mesh.isVisible = newState;
    }

    render() {
        const mesh = this.props.mesh;

        const visibilityElement = this.state.isVisible ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} className="isNotActive" />

        return (
            <div className="meshTools">
                <TreeItemLabelComponent label={mesh.name} onClick={() => this.props.onClick()} icon={faCube} color="dodgerblue" />
                <div className={this.state.isGizmoEnabled ? "gizmo selected icon" : "gizmo icon"} onClick={() => this.showGizmos()} title="Show/Hide position gizmo">
                    <FontAwesomeIcon icon={faVectorSquare} />
                </div>
                <div className="visibility icon" onClick={() => this.switchVisibility()} title="Show/Hide mesh">
                    {visibilityElement}
                </div>
                {
                    <ExtensionsComponent target={mesh} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}