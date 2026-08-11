function renderPagination(containerId, currentPage, totalPages, callback) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = "";

    if (totalPages <= 1) return;

    if (currentPage > 1) {

        container.innerHTML += `
            <button onclick="${callback.name}(${currentPage-1})"
                class="px-3 py-1 border rounded">
                Prev
            </button>
        `;

    }

    for(let i=1;i<=totalPages;i++){

        container.innerHTML += `
            <button onclick="${callback.name}(${i})"
                class="px-3 py-1 border rounded ${i===currentPage?'bg-purple-600 text-white':''}">
                ${i}
            </button>
        `;

    }

    if(currentPage<totalPages){

        container.innerHTML += `
            <button onclick="${callback.name}(${currentPage+1})"
                class="px-3 py-1 border rounded">
                Next
            </button>
        `;

    }

}