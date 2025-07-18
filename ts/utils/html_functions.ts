export function insertChildAtIndex(parent: HTMLElement, child: HTMLElement, index: number) {
    if (index >= parent.children.length || index === -1) {
        parent.appendChild(child);
    } else {
        parent.insertBefore(child, parent.children[index]);
    }
}