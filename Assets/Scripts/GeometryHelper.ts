/**
 * GeometryHelper.ts
 * Procedural mesh construction helpers using Lens Studio's runtime MeshBuilder API.
 * All polygons follow counter-clockwise (CCW) winding from the exterior
 * to render correctly with back-face culling enabled.
 */

export class GeometryHelper {
    private static cachedBaseMaterial: Material | null = null;

    /**
     * Finds an existing material in the scene (e.g. from SIK visuals) to use as a cloning template.
     */
    public static getBaseMaterial(): Material | null {
        if (this.cachedBaseMaterial) {
            return this.cachedBaseMaterial;
        }

        const count = global.scene.getRootObjectsCount();
        for (let i = 0; i < count; i++) {
            const root = global.scene.getRootObject(i);
            const mat = this.findMaterialRecursive(root);
            if (mat) {
                this.cachedBaseMaterial = mat;
                return mat;
            }
        }
        return null;
    }

    private static findMaterialRecursive(obj: SceneObject): Material | null {
        const visual = obj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        if (visual && visual.mainMaterial) {
            return visual.mainMaterial;
        }
        const childrenCount = obj.getChildrenCount();
        for (let i = 0; i < childrenCount; i++) {
            const found = this.findMaterialRecursive(obj.getChild(i));
            if (found) return found;
        }
        return null;
    }

    /**
     * Creates or clones a Material configured with specific color, alpha, and blend mode.
     */
    public static createMaterial(color: vec4, isAdditive: boolean = false): Material | null {
        const base = this.getBaseMaterial();
        if (!base) return null;

        const clone = base.clone();
        try {
            if (clone.mainPass) {
                clone.mainPass.baseColor = color;
                if (isAdditive) {
                    clone.mainPass.blendMode = BlendMode.Add;
                    clone.mainPass.depthWrite = false;
                } else if (color.w < 0.99) {
                    clone.mainPass.blendMode = BlendMode.Normal;
                    clone.mainPass.depthWrite = false;
                } else {
                    clone.mainPass.blendMode = BlendMode.Disabled;
                    clone.mainPass.depthWrite = true;
                }
            }
        } catch (e) {
            // Safe fallback if specific Pass properties are missing
        }
        return clone;
    }

    /**
     * Builds a 3D box mesh centered at origin with half-extents hw, hh, hd.
     */
    public static createBoxMesh(
        hw: number,
        hh: number,
        hd: number,
        color: [number, number, number, number] = [1, 1, 1, 1]
    ): RenderMesh {
        const builder = new MeshBuilder([
            { name: "position", components: 3 },
            { name: "normal", components: 3, normalized: true },
            { name: "color", components: 4 },
        ]);
        builder.topology = MeshTopology.Triangles;
        builder.indexType = MeshIndexType.UInt16;

        const x0 = -hw, x1 = hw;
        const y0 = -hh, y1 = hh;
        const z0 = -hd, z1 = hd;

        const verts: number[] = [];
        const indices: number[] = [];
        let vi = 0;

        const addFace = (
            p0: number[],
            p1: number[],
            p2: number[],
            p3: number[],
            n: number[]
        ) => {
            verts.push(
                ...p0, ...n, ...color,
                ...p1, ...n, ...color,
                ...p2, ...n, ...color,
                ...p3, ...n, ...color
            );
            // Verified CCW winding: p0 -> p1 -> p2, p0 -> p2 -> p3
            indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
            vi += 4;
        };

        addFace([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]);   // +X
        addFace([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0]);  // -X
        addFace([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]);   // +Y
        addFace([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0]);  // -Y
        addFace([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);   // +Z
        addFace([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);  // -Z

        builder.appendVerticesInterleaved(verts);
        builder.appendIndices(indices);
        builder.updateMesh();
        return builder.getMesh();
    }

    /**
     * Builds a cylinder centered along the Y axis with given radius and total height.
     */
    public static createCylinderMesh(
        radius: number,
        height: number,
        segments: number = 16,
        color: [number, number, number, number] = [1, 1, 1, 1]
    ): RenderMesh {
        const builder = new MeshBuilder([
            { name: "position", components: 3 },
            { name: "normal", components: 3, normalized: true },
            { name: "color", components: 4 },
        ]);
        builder.topology = MeshTopology.Triangles;
        builder.indexType = MeshIndexType.UInt16;

        const halfH = height * 0.5;
        const verts: number[] = [];
        const indices: number[] = [];
        let vi = 0;

        // Side quads
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + 1) / segments) * Math.PI * 2;

            const c0 = Math.cos(a0), s0 = Math.sin(a0);
            const c1 = Math.cos(a1), s1 = Math.sin(a1);

            const p0 = [c0 * radius, -halfH, s0 * radius];
            const p1 = [c0 * radius, halfH, s0 * radius];
            const p2 = [c1 * radius, halfH, s1 * radius];
            const p3 = [c1 * radius, -halfH, s1 * radius];

            const n0 = [c0, 0, s0];
            const n1 = [c1, 0, s1];

            verts.push(
                ...p0, ...n0, ...color,
                ...p1, ...n0, ...color,
                ...p2, ...n1, ...color,
                ...p3, ...n1, ...color
            );

            indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
            vi += 4;
        }

        // Top cap (+Y)
        const topCenter = [0, halfH, 0];
        const topNormal = [0, 1, 0];
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + 1) / segments) * Math.PI * 2;
            const p0 = [Math.cos(a0) * radius, halfH, Math.sin(a0) * radius];
            const p1 = [Math.cos(a1) * radius, halfH, Math.sin(a1) * radius];

            verts.push(
                ...topCenter, ...topNormal, ...color,
                ...p0, ...topNormal, ...color,
                ...p1, ...topNormal, ...color
            );
            indices.push(vi, vi + 1, vi + 2);
            vi += 3;
        }

        // Bottom cap (-Y)
        const bottomCenter = [0, -halfH, 0];
        const bottomNormal = [0, -1, 0];
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + 1) / segments) * Math.PI * 2;
            const p0 = [Math.cos(a0) * radius, -halfH, Math.sin(a0) * radius];
            const p1 = [Math.cos(a1) * radius, -halfH, Math.sin(a1) * radius];

            verts.push(
                ...bottomCenter, ...bottomNormal, ...color,
                ...p1, ...bottomNormal, ...color,
                ...p0, ...bottomNormal, ...color
            );
            indices.push(vi, vi + 1, vi + 2);
            vi += 3;
        }

        builder.appendVerticesInterleaved(verts);
        builder.appendIndices(indices);
        builder.updateMesh();
        return builder.getMesh();
    }

    /**
     * Builds a horizontal surface disc in the XZ plane with radial vertex color gradient.
     */
    public static createDiscMesh(
        radius: number,
        segments: number = 32,
        centerColor: [number, number, number, number] = [1, 1, 1, 1],
        edgeColor: [number, number, number, number] = [1, 1, 1, 0]
    ): RenderMesh {
        const builder = new MeshBuilder([
            { name: "position", components: 3 },
            { name: "normal", components: 3, normalized: true },
            { name: "color", components: 4 },
        ]);
        builder.topology = MeshTopology.Triangles;
        builder.indexType = MeshIndexType.UInt16;

        const verts: number[] = [];
        const indices: number[] = [];
        const normal = [0, 1, 0];

        // Center vertex (index 0)
        verts.push(0, 0, 0, ...normal, ...centerColor);

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            verts.push(x, 0, z, ...normal, ...edgeColor);
        }

        for (let i = 1; i <= segments; i++) {
            indices.push(0, i, i + 1);
        }

        builder.appendVerticesInterleaved(verts);
        builder.appendIndices(indices);
        builder.updateMesh();
        return builder.getMesh();
    }

    /**
     * Helper to instantiate a child visual object with transform, mesh, and optional material.
     */
    public static createVisualObject(
        name: string,
        mesh: RenderMesh,
        parent: SceneObject | null = null,
        localPosition: vec3 = vec3.zero(),
        localRotation: quat = quat.quatIdentity(),
        localScale: vec3 = vec3.one(),
        material: Material | null = null
    ): SceneObject {
        const obj = global.scene.createSceneObject(name);
        if (parent) {
            obj.setParent(parent);
        }
        const transform = obj.getTransform();
        transform.setLocalPosition(localPosition);
        transform.setLocalRotation(localRotation);
        transform.setLocalScale(localScale);

        const rmv = obj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        rmv.mesh = mesh;
        if (material) {
            rmv.clearMaterials();
            rmv.addMaterial(material);
        }

        return obj;
    }
}

