﻿module BABYLON {
    export class DirectionalLight extends Light implements IShadowLight {
        public position: Vector3;

        private _transformedDirection: Vector3;
        public transformedPosition: Vector3;
        private _worldMatrix: Matrix;

        constructor(name: string, public direction: Vector3, scene: Scene) {
            super(name, scene);

            this.position = direction.scale(-1);
        }

        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
        }

        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }

        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var orthoLeft = Number.MAX_VALUE;
            var orthoRight = Number.MIN_VALUE;
            var orthoTop = Number.MIN_VALUE;
            var orthoBottom = Number.MAX_VALUE;

            var tempVector3 = Vector3.Zero();

            var activeCamera = this.getScene().activeCamera;

            // Check extends
            for (var meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                var boundingBox = renderList[meshIndex].getBoundingInfo().boundingBox;

                for (var index = 0; index < boundingBox.vectorsWorld.length; index++) {
                    Vector3.TransformCoordinatesToRef(boundingBox.vectorsWorld[index], viewMatrix, tempVector3);

                    if (tempVector3.x < orthoLeft)
                        orthoLeft = tempVector3.x;
                    if (tempVector3.y < orthoBottom)
                        orthoBottom = tempVector3.y;

                    if (tempVector3.x > orthoRight)
                        orthoRight = tempVector3.x;
                    if (tempVector3.y > orthoTop)
                        orthoTop = tempVector3.y;
                }
            }

            var orthoWidth = Math.max(Math.abs(orthoRight), Math.abs(orthoLeft)) * 1.1;
            var orthoHeight = Math.max(Math.abs(orthoTop), Math.abs(orthoBottom)) * 1.1;

            Matrix.OrthoOffCenterLHToRef(-orthoWidth, orthoWidth, -orthoHeight, orthoHeight, activeCamera.minZ, activeCamera.maxZ, matrix);
        }

        public supportsVSM(): boolean {
            return false;
        }

        public needRefreshPerFrame(): boolean {
            return true;
        }

        public computeTransformedPosition(): boolean {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this.transformedPosition) {
                    this.transformedPosition = Vector3.Zero();
                }

                Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);
                return true;
            }

            return false;
        }

        public transferToEffect(effect: Effect, directionUniformName: string): void {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = Vector3.Zero();
                }

                Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);
                effect.setFloat4(directionUniformName, this._transformedDirection.x, this._transformedDirection.y, this._transformedDirection.z, 1);

                return;
            }

            effect.setFloat4(directionUniformName, this.direction.x, this.direction.y, this.direction.z, 1);
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }
    }
}  