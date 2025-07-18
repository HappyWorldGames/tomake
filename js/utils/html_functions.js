export function insertChildAtIndex(parent, child, index) {
    if (index >= parent.children.length || index === -1) {
        parent.appendChild(child);
    }
    else {
        parent.insertBefore(child, parent.children[index]);
    }
}
