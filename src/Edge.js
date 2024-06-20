import { TkMath } from '@hrimthurs/tackle'

export class Edge {

    #outNormal
    #inNormal

    constructor (curr, next) {
        this.curr = curr
        this.next = next

        this.#outNormal = this.#outwardsNormal()
        this.#inNormal = this.#inwardsNormal()
    }

    offset(distance) {
        const { x, y } = this.#inNormal
        return this.#offsetEdge(this.curr, this.next, x * distance, y * distance)
    }

    inverseOffset(distance) {
        const { x, y } = this.#outNormal
        return this.#offsetEdge(this.next, this.curr, x * distance, y * distance)
    }

    #outwardsNormal() {
        const { x, y } = this.#inwardsNormal()
        return { x: -x, y: -y }
    }

    #inwardsNormal() {
        const delta = TkMath.delta2D(this.next, this.curr)
        const dist = TkMath.dist2D(this.next, this.curr)
        return { x: -delta.y / dist, y: delta.x / dist }
    }

    #offsetEdge = function(curr, next, dx, dy) {
        const offsCurr = { x: curr.x + dx, y: curr.y + dy }
        const offsNext = { x: next.x + dx, y: next.y + dy }

        return new Edge(offsCurr, offsNext)
    }

}