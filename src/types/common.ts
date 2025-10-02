import type { ColorRepresentation, EulerOrder } from 'three'

/**
 * Immutable tuple describing a 3D vector. Values follow the `[x, y, z]` order.
 */
export type Vec3 = readonly [number, number, number]

/**
 * Tuple describing Euler rotation in radians. Optional fourth slot allows specifying the rotation order.
 */
export type EulerTuple = readonly [number, number, number, EulerOrder?]

/**
 * Supported colour representations accepted by vhree.js composables and components.
 */
export type ColorLike = ColorRepresentation

/**
 * Function signature for explicit cleanup handlers returned by composables.
 */
export type Disposable = () => void
