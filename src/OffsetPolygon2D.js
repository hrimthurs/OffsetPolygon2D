import { TkMath } from '@hrimthurs/tackle'
import { Polygon } from 'gpc.js'

import { Edge } from './Edge.js'

export class OffsetPolygon2D {

    #verts = null
    #edges = []

    #arcSegments = 5
    #distance = 0

    constructor (vertices, arcSegments, distance) {
        this.vertices(vertices)
        this.arcSegments(arcSegments)
        this.distance(distance)
    }

    vertices(verts) {
        if (verts !== undefined) {
            verts = verts.filter((pt, ind) => !TkMath.isEqualCoords2D(pt, verts[ind > 0 ? ind - 1: verts.length - 1]))

            if (verts.length > 0) {
                this.#verts = this.#closePolygon(this.#orientRings(verts))
                this.#edges = this.#verts.map((vert, ind) => new Edge(vert, this.#verts[(ind + 1) % (this.#verts.length - 1)]))
            }
        }

        return this
    }

    distance(dist) {
        if (dist !== undefined) this.#distance = dist
        return this
      }

    arcSegments(arcSegments) {
        if (arcSegments !== undefined) this.#arcSegments = arcSegments
        return this
    }

    offsetBoth(dist) {
        this.distance(dist)

        return this.#distance === 0
            ? this.#closedVerts
            : this.#orientRings(this.#offsetContour(Math.abs(this.#distance), null))
    }

    offset(dist) {
        this.distance(dist)

        return this.#distance === 0
            ? this.#closedVerts
            : this.#distance > 0
                ? this.margin(this.#distance)
                : this.padding(-this.#distance)
    }

    margin(dist) {
        this.distance(dist)

        return this.#distance === 0
            ? this.#closedVerts
            : this.#orientRings(this.#offsetContour(this.#distance, false))
    }

    padding(dist) {
        this.distance(dist)

        return this.#distance === 0
            ? this.#closedVerts
            : this.#orientRings(this.#offsetContour(-this.#distance, true))
    }

    get #closedVerts() {
        return [this.#closePolygon(this.#verts)]
    }

    #orientRings(coords, depth = 0, isHole = false) {
        if (coords) {

            const isArrCoords = (coords.length > 0) && ('x' in coords[0])
            if (isArrCoords) {

                const area = TkMath.areaPolygon2D(coords, true)
                if ((!isHole && (area > 0)) || (isHole && (area < 0))) coords.reverse()
                if (depth === 0) coords.push({ x: coords[0].x, y: coords[0].y })
            } else {
                coords.forEach((coord, ind) => {
                    this.#orientRings(coord, depth + 1, ind > 0)
                })
            }
        }

        return coords
    }

    #offsetContour(distance, innerSide) {
        if (this.#verts) {

            let polygon = this.#makePolygon(this.#verts[0], this.#verts[1], this.#edges[0], distance)

            for (let i = 1; i < this.#verts.length - 1; i++) {
                const ptA = this.#verts[i]
                const ptB = this.#verts[i + 1]
                const edge = this.#edges[i]

                try {
                    polygon = polygon.union(this.#makePolygon(ptA, ptB, edge, distance))
                } catch {
                    polygon = polygon.union(this.#makePolygon(this.#shiftPoint(ptA), this.#shiftPoint(ptB), edge, distance))
                }
            }

            const { bounds, holes } = polygon.toVertices()

            const contours = innerSide === null
                ? [...bounds, ...holes]
                : innerSide
                    ? [...holes]
                    : [...bounds]

            return contours.map((contour) => this.#closePolygon(contour))
        }
    }

    #makePolygon(ptA, ptB, edge, distance) {
        let points = []

        const edgeOffset = edge.offset(distance)
        const edgeOffsetInv = edge.inverseOffset(distance)

        this.#generateArc(ptA, edgeOffsetInv.next, edgeOffset.curr, distance, points)
        this.#generateArc(ptB, edgeOffset.next, edgeOffsetInv.curr, distance, points)

        return Polygon.fromPoints(this.#closePolygon(points))
    }

    #generateArc(center, ptStart, ptEnd, distance, points) {
        points.push(ptStart)

        const angleStart = this.#positiveAngle(Math.atan2(ptStart.y - center.y, ptStart.x - center.x))
        const angleEnd = this.#positiveAngle(Math.atan2(ptEnd.y - center.y, ptEnd.x - center.x))
        const angleBetween = this.#positiveAngle(angleStart - angleEnd)

        let segments = this.#arcSegments % 2 !== 0
            ? this.#arcSegments - 1
            : this.#arcSegments

        const angleSegment = -angleBetween / segments

        for (let i = segments - 1; i > 0; i--) {
            const angle = angleStart + (angleSegment * i)

            points.push({
                x: center.x + Math.cos(angle) * distance,
                y: center.y + Math.sin(angle) * distance
            })
        }

        points.push(ptEnd)
    }

    #positiveAngle(angle) {
        return angle < 0 ? angle + TkMath.DOUBLE_PI : angle
    }

    #closePolygon(vertices) {
        const isOpen = !TkMath.isEqualCoords2D(vertices[0], vertices[vertices.length - 1])
        if (isOpen) vertices.push(vertices[0])

        return vertices
    }

    #shiftPoint(pt) {
        pt.x += (Math.random() - 0.5) / 100,
        pt.y += (Math.random() - 0.5) / 100

        return pt
    }

}