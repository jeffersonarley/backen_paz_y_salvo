function ordenarTrazasFirma(trazas) {
    return [...trazas].sort((a, b) => {
        if (Number.isInteger(a.orden) && Number.isInteger(b.orden) && a.orden !== b.orden) {
            return a.orden - b.orden;
        }

        const fechaAreaA = new Date(a.area_id?.createdAt || a.createdAt || 0).getTime();
        const fechaAreaB = new Date(b.area_id?.createdAt || b.createdAt || 0).getTime();
        if (fechaAreaA !== fechaAreaB) {
            return fechaAreaA - fechaAreaB;
        }

        const areaA = String(a.area_id?._id || a.area_id || a._id);
        const areaB = String(b.area_id?._id || b.area_id || b._id);
        return areaA.localeCompare(areaB);
    });
}

module.exports = ordenarTrazasFirma;
