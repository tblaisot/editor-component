import '@webcomponents/custom-elements/src/native-shim.js';
import './style.css';

const HANDLE_SIZE = 20;
const ROTATE_HANDLE_Y_OFFSET = HANDLE_SIZE * 2 + HANDLE_SIZE / 2;


const POSITIONS = [
    "top_left",
    "top_middle",
    "top_right",
    "middle_left",
    "middle_right",
    "bottom_left",
    "bottom_middle",
    "bottom_right",
];

// Types

type Size = [number, number];
type AbsCoords = [number, number];
type RelCoords = [number, number];
type AngleDeg = number;
type AngleRad = number;

interface SizesAndCoords {
    handle_size: number;
    box_height: number;
    box_width: number;
    height: number;
    width: number;
    box_top: number;
    box_left: number;
    top_offset: number;
    left_offset: number;

    rotate: AbsCoords;
    top_left: AbsCoords;
    top_middle: AbsCoords;
    top_right: AbsCoords;
    middle_left: AbsCoords;
    middle_right: AbsCoords;
    bottom_left: AbsCoords;
    bottom_middle: AbsCoords;
    bottom_right: AbsCoords;
    center: AbsCoords;
}

interface References {
    selectedElement: Element;
    startAngularCoords: RelCoords;
    startCoords: AbsCoords;
    startAngle: AngleDeg,
    center: AbsCoords;
    handle: string;
    size: Size;
    startSVGPosition: AbsCoords;
    absCenterCoords: AbsCoords;
    absStartCoords: AbsCoords;
    absStartAngle: AngleDeg;
    relStartCoords: RelCoords;
    relEndCoords: RelCoords;
}

// Pure Fonctions

/**
 *convert AbsCoords to RelCoords relative to the center and the angle
 * y' = y*cos(a) - x*sin(a)
 * x' = y*sin(a) + x*cos(a)
 * @param center
 * @param angle
 * @param coords
 */
function convertCoords(center: AbsCoords, angle: AngleDeg, coords: AbsCoords): RelCoords {
    const [xold, yold] = coords;
    const [cx, cy] = center;
    const x = (xold - cx);
    const y = -(yold - cy); // redressement des coordonnées
    const anglerad = Math.PI / 180 * angle;
    const yprime = Math.round(y * Math.cos(anglerad) + x * Math.sin(anglerad));
    const xprime = -Math.round(y * Math.sin(anglerad) - x * Math.cos(anglerad));
    return [xprime, yprime];
}

/**
 * Get coords relative from center
 * @param coordCenter
 * @param coord
 * @deprecated ?
 */
function getCoordsFromCenter(coordCenter: AbsCoords, coord: AbsCoords): RelCoords {
    return [coord[0] - coordCenter[0], coord[1] - coordCenter[1]];
}


/**
 * Get angle
 * @param coords
 *
 * @deprecated ?
 */
function getAngle(coords: AbsCoords): AngleRad {
    return Math.atan2(coords[1], coords[0]);
}

/**
 *
 * @param element
 */
function getAbsWindowsCoords(element: HTMLElement): AbsCoords {
    const x = window.scrollX + element.getBoundingClientRect().left; // X
    const y = window.scrollY + element.getBoundingClientRect().top; // Y
    return [x, y]
}

/**
 *
 * @param element
 */
function getSize(element: HTMLElement): Size {
    const h = element.getBoundingClientRect().height; // H
    const w = element.getBoundingClientRect().width; // W
    return [w, h]
}

// main

export class BoxEditor {

    refs: Partial<References> = {};

    svg: HTMLElement;
    handles: { [handle: string]: HTMLElement };
    box: HTMLElement;
    center: HTMLElement;
    rotate_handle: HTMLElement;
    rotate_line: HTMLElement;

    coords: SizesAndCoords;

    constructor(element: HTMLElement) {
        // create dom svg
        this.createDOM();

        // init
        this.init();

        // map box-editor to the element
        this.wrapElement(element);

    }

    createDOM() {
    }

    wrapElement(element: HTMLElement) {
        const [h, w] = getSize(element);
        this.updateSize(h, w);
        const [top, left] = getAbsWindowsCoords(element);
        this.updateTop(top - this.coords.box_top);
        this.updateLeft(left - this.coords.box_left);
    }

    init() {

        // SVG Elements references
        this.svg = document.getElementById("box-editor");
        this.handles = {};
        POSITIONS.forEach((position) => {
            this.handles[position] = this.svg.querySelector(`#handle_${position}`);
        });
        this.box = this.svg.querySelector(`#box`);
        this.center = this.svg.querySelector(`#center`);
        this.rotate_handle = this.svg.querySelector(`#handle_rotate`);
        this.handles['rotate'] = this.rotate_handle;
        this.rotate_line = this.svg.querySelector(`#handle_rotate_link`);

        // Init Events
        this.makeDraggable();
    }

    makeDraggable() {
        document.addEventListener('mousedown', this.handleStartDrag.bind(this));
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    }

    destroy() {
        // delete svg
    }

    // get functions

    private getSVGAngle(): AngleDeg {
        const result = this.svg.style.transform.match(/rotate\(([0-9\.]+)deg\)/);
        return parseInt(result[1])
    }

    private getCenter(): AbsCoords {
        return getAbsWindowsCoords(this.center);
    }

    private calculateCoords(width, height): SizesAndCoords {
        const bottom = ROTATE_HANDLE_Y_OFFSET + height;
        const bottom_handle_y = bottom - HANDLE_SIZE / 2 - 1;
        const top = ROTATE_HANDLE_Y_OFFSET;
        const top_handle_y = top - HANDLE_SIZE / 2 - 1;
        const middle = top + height / 2 - HANDLE_SIZE / 2;
        const middle_handle_y = middle;
        return {
            "handle_size": HANDLE_SIZE,
            "box_height": height,
            "box_width": width,
            "height": height + 60,
            "width": width + 20,
            "box_top": ROTATE_HANDLE_Y_OFFSET,
            "box_left": HANDLE_SIZE / 2,
            "top_offset": -50,
            "left_offset": -10,
            "rotate": [width / 2 + HANDLE_SIZE / 2, HANDLE_SIZE / 2 + 1],
            "top_left": [1, top_handle_y],
            "top_middle": [width / 2, top_handle_y],
            "top_right": [width - 1, top_handle_y],
            "middle_left": [1, middle_handle_y],
            "middle_right": [width - 1, middle_handle_y],
            "bottom_left": [1, bottom_handle_y],
            "bottom_middle": [width / 2, bottom_handle_y],
            "bottom_right": [width - 1, bottom_handle_y],
            "center": [(width + 20) / 2, ROTATE_HANDLE_Y_OFFSET + height / 2]
        }
    }

    // update functions

    private updateCoordsHandle(handle: HTMLElement, x: number, y: number) {
        handle.setAttribute('x', x.toString());
        handle.setAttribute('y', y.toString());
    }

    private updateBox(coords: SizesAndCoords) {
        this.box.setAttribute('x', coords.box_left.toString());
        this.box.setAttribute('y', coords.box_top.toString());
        this.box.setAttribute('width', coords.box_width.toString());
        this.box.setAttribute('height', coords.box_height.toString());
    }

    private updateSVG(coords: SizesAndCoords) {
        this.svg.setAttribute('height', coords.height.toString());
        this.svg.setAttribute('width', coords.width.toString());
        this.svg.setAttribute('viewBox', `0 0 ${coords.width.toString()} ${coords.height.toString()}`);
    }

    private updateCoordsRotateHandle(coords: SizesAndCoords) {
        this.rotate_handle.setAttribute('cx', coords.rotate[0].toString());
        this.rotate_handle.setAttribute('cy', coords.rotate[1].toString());
        this.rotate_line.setAttribute('x1', coords.rotate[0].toString());
        this.rotate_line.setAttribute('x2', coords.rotate[0].toString());
    }

    private updateCoordsHandles(coords: SizesAndCoords) {
        POSITIONS.forEach((position) => {
            this.updateCoordsHandle(this.handles[position], coords[position][0], coords[position][1])
        });
    }

    private updateCenter(coords: SizesAndCoords) {
        this.center.setAttribute('cx', coords.center[0].toString());
        this.center.setAttribute('cy', coords.center[1].toString());
    }

    private updateSize(w: number, h: number) {
        this.coords = this.calculateCoords(w, h);

        this.updateCoordsHandles(this.coords);
        this.updateCoordsRotateHandle(this.coords);
        this.updateCenter(this.coords);
        this.updateBox(this.coords);
        this.updateSVG(this.coords);
    }

    private updateTop(top: number) {
        this.svg.style.top = `${top}px`;
    }

    private updateLeft(left: number) {
        this.svg.style.left = `${left}px`;
    }

    private applyTransformations(evt) {
        const destCoords: AbsCoords = [evt.pageX, evt.pageY];

        if (this.refs.handle == 'rotate') {
            // coords from center
            const destAngularCoords = getCoordsFromCenter(this.refs.absCenterCoords, destCoords);
            const destAngle = getAngle(destAngularCoords);
            const angle = ((destAngle - this.refs.startAngle) * (180 / Math.PI)).toFixed(2);
            this.svg.style.transformOrigin = `${this.refs.center[0]}px ${this.refs.center[1]}px`;
            this.svg.style.transform = `rotate(${angle}deg)`;
        } else {
            let newsize;

            this.refs.relEndCoords = convertCoords(this.refs.absCenterCoords, this.refs.absStartAngle, destCoords);
            const offsets = [(this.refs.relEndCoords[0] - this.refs.relStartCoords[0]), (this.refs.relEndCoords[1] - this.refs.relStartCoords[1])];

            if (this.refs.handle == 'move') {
                this.updateLeft(this.refs.startSVGPosition[0] + offsets[0]);
                this.updateTop(this.refs.startSVGPosition[1] - offsets[1]);
            } else {

                /**
                 * regles:
                 * si bottom_ => sizeY = sizeY - offsetY
                 * si top_ => sizeY = sizeY + offsetY
                 * si middle_ => sizeY = sizeY
                 * si _left => sizeY = sizeX - offsetX
                 * si _right => sizeY = sizeX + offsetX
                 * si _middle => sizeY = sizeX
                 */
                switch (this.refs.handle) {
                    case 'top_right':
                        newsize = [this.refs.size[0] + offsets[0], this.refs.size[1] + offsets[1]];
                        this.updateTop(this.refs.startSVGPosition[1] - offsets[1]);
                        break;
                    case 'bottom_right':
                        newsize = [this.refs.size[0] + offsets[0], this.refs.size[1] - offsets[1]];
                        break;
                    case 'top_left':
                        newsize = [this.refs.size[0] - offsets[0], this.refs.size[1] + offsets[1]];
                        this.updateTop(this.refs.startSVGPosition[1] - offsets[1]);
                        this.updateLeft(this.refs.startSVGPosition[0] + offsets[0]);
                        break;
                    case 'bottom_left':
                        newsize = [this.refs.size[0] - offsets[0], this.refs.size[1] - offsets[1]];
                        this.updateLeft(this.refs.startSVGPosition[0] + offsets[0]);
                        break;
                    case 'top_middle':
                        newsize = [this.refs.size[0], this.refs.size[1] + offsets[1]];
                        this.updateTop(this.refs.startSVGPosition[1] - offsets[1]);
                        break;
                    case 'bottom_middle':
                        newsize = [this.refs.size[0], this.refs.size[1] - offsets[1]];
                        break;
                    case 'middle_left':
                        newsize = [this.refs.size[0] - offsets[0], this.refs.size[1]];
                        this.updateLeft(this.refs.startSVGPosition[0] + offsets[0]);
                        break;
                    case 'middle_right':
                        newsize = [this.refs.size[0] + offsets[0], this.refs.size[1]];
                        break;
                }
                this.updateSize(newsize[0], newsize[1])
            }
        }
    }

    // Event Handling

    private handleStartDrag(evt) {

        if (evt.target.classList.contains('draggable')) {
            this.refs.selectedElement = evt.target;
            const selectedElementId = this.refs.selectedElement.getAttribute('id');
            if (selectedElementId.match(/handle_.*/)) {
                this.refs.handle = selectedElementId.replace(/handle_/, '');
            } else if (
                selectedElementId === 'box'
                || selectedElementId === 'center'
                || selectedElementId === 'box-editor'
            ) {
                this.refs.handle = 'move';
            } else {
                this.refs.handle = null;
            }
            const absStartCoords: AbsCoords = [evt.pageX, evt.pageY];


            this.refs.absCenterCoords = this.getCenter();
            this.refs.absStartCoords = absStartCoords;
            this.refs.absStartAngle = this.getSVGAngle();
            this.refs.relStartCoords = convertCoords(this.refs.absCenterCoords, this.refs.absStartAngle, this.refs.absStartCoords);

            this.refs.startCoords = absStartCoords;
            this.refs.startSVGPosition = [parseInt(this.svg.style.left), parseInt(this.svg.style.top)];


            switch (this.refs.handle) {
                case 'rotate':
                    this.refs.center = [
                        parseInt(this.center.getAttribute('cx')),
                        parseInt(this.center.getAttribute('cy'))
                    ];
                    this.refs.startAngularCoords = getCoordsFromCenter(this.refs.absCenterCoords, this.refs.startCoords);
                    this.refs.startAngle = getAngle(this.refs.startAngularCoords);
                    break;
                case 'box':
                case 'center':
                    break;
                case 'top_right':
                case 'bottom_right':
                case 'top_left':
                case 'bottom_left':
                case 'top_middle':
                case 'bottom_middle':
                case 'middle_left':
                case 'middle_right':
                    this.refs.size = [
                        parseInt(this.box.getAttribute('width')),
                        parseInt(this.box.getAttribute('height'))
                    ];
                    break;
            }

        }
    }

    private handleDrag(evt) {
        if (evt.button === 1 && this.refs.selectedElement) {
            evt.preventDefault();
            this.applyTransformations(evt);
        }
    }

    private handleDragEnd(evt) {
        if (this.refs.selectedElement) {
            // evt.preventDefault();
            this.applyTransformations(evt);
        }

        this.refs.selectedElement = null;
    }
}

const editor = new BoxEditor(document.querySelector('#lorem-lipsum'));
