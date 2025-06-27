import { For, Show, createSignal, createMemo } from 'solid-js'

export default function InventoryTab(props) {
  const { invSearch, setInvSearch, inventoryList, useInventory, deleteInventory } = props

  // Sayfalama
  const [currentPage, setCurrentPage] = createSignal(1)
  const [itemsPerPage, setItemsPerPage] = createSignal(12)
  const [sortBy, setSortBy] = createSignal('name') // name, amount, recent
  const [viewMode, setViewMode] = createSignal('grid') // grid, list

  // Sıralanmış envanter
  const sortedInventory = createMemo(() => {
    let sorted = [...inventoryList()]
    
    switch (sortBy()) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'amount':
        sorted.sort((a, b) => b.amount - a.amount)
        break
      case 'recent':
        sorted.sort((a, b) => (b.id || 0) - (a.id || 0))
        break
    }
    
    return sorted
  })

  // Sayfalanmış envanter
  const paginatedInventory = createMemo(() => {
    const start = (currentPage() - 1) * itemsPerPage()
    const end = start + itemsPerPage()
    return sortedInventory().slice(start, end)
  })

  const totalPages = createMemo(() => 
    Math.ceil(sortedInventory().length / itemsPerPage())
  )

  // Sayfa değiştirme
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page)
    }
  }

  // Kategori ikonu
  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase()
    if (lower.includes('temizlik') || lower.includes('süpürge') || lower.includes('deterjan')) return '🧹'
    if (lower.includes('yemek') || lower.includes('pasta') || lower.includes('kek')) return '🍰'
    if (lower.includes('egzersiz') || lower.includes('spor') || lower.includes('fitness')) return '💪'
    if (lower.includes('kitap') || lower.includes('ders') || lower.includes('öğren')) return '📚'
    if (lower.includes('oyun') || lower.includes('eğlence')) return '🎮'
    if (lower.includes('ödül') || lower.includes('hediye')) return '🎁'
    return '📦'
  }

  // Miktar rengini belirle
  const getAmountColor = (amount) => {
    if (amount >= 10) return 'text-green-600 bg-green-100'
    if (amount >= 5) return 'text-yellow-600 bg-yellow-100'
    if (amount >= 1) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div class="space-y-6">
      {/* Başlık */}
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
          🎒 Envanter
        </h1>
        <p class="text-gray-600">Kazandığın tüm ödülleri görüntüle ve kullan!</p>
      </div>

      {/* İstatistikler */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-green-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">📦</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Toplam Eşya</div>
              <div class="text-lg md:text-xl font-bold text-green-600 truncate">{sortedInventory().length}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-blue-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">📊</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Toplam Adet</div>
              <div class="text-lg md:text-xl font-bold text-blue-600 truncate">
                {sortedInventory().reduce((sum, item) => sum + item.amount, 0)}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-purple-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">⭐</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">En Fazla</div>
              <div class="text-lg md:text-xl font-bold text-purple-600 truncate">
                {Math.max(...sortedInventory().map(item => item.amount), 0)}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-orange-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">🎯</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Kategoriler</div>
              <div class="text-lg md:text-xl font-bold text-orange-600 truncate">
                {new Set(sortedInventory().map(item => getCategoryIcon(item.name))).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kontroller */}
      <div class="bg-white rounded-lg p-3 md:p-4 shadow-md mb-6">
        <div class="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center">
          <div class="flex-1 min-w-0">
            <input 
              class="w-full border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all text-sm md:text-base" 
              value={invSearch()} 
              onInput={e => setInvSearch(e.target.value)} 
              placeholder="🔍 Envanterde ara..." 
            />
          </div>
          
          <div class="flex gap-2 items-center justify-between md:justify-start">
            <select 
              class="flex-1 md:flex-none border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm md:text-base min-w-0" 
              value={sortBy()} 
              onInput={e => setSortBy(e.target.value)}
            >
              <option value="name">📝 İsme göre</option>
              <option value="amount">📊 Miktara göre</option>
              <option value="recent">🕒 Yeniye göre</option>
            </select>
            
            <div class="flex bg-gray-100 rounded-lg p-1 shrink-0">
              <button 
                class={`p-2 rounded transition-all text-sm ${viewMode() === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'}`}
                onClick={() => setViewMode('grid')}
                title="Kart görünümü"
              >
                ⊞
              </button>
              <button 
                class={`p-2 rounded transition-all text-sm ${viewMode() === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'}`}
                onClick={() => setViewMode('list')}
                title="Liste görünümü"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Envanter İçeriği */}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            🎒 Envanter Öğeleri
            <span class="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {sortedInventory().length} öğe
            </span>
          </h2>
        </div>

        <Show when={paginatedInventory().length === 0} fallback={
          <div class="p-3 md:p-6 overflow-hidden">
            <Show when={viewMode() === 'grid'} fallback={
              <div class="space-y-3">
                <For each={paginatedInventory()}>{item =>
                  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3">
                    <div class="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                      <div class="text-2xl md:text-3xl shrink-0">{getCategoryIcon(item.name)}</div>
                      <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-base md:text-lg text-gray-800 truncate">{item.name}</h3>
                        <p class="text-gray-600 text-xs md:text-sm truncate">{item.description || 'Açıklama yok'}</p>
                      </div>
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <span class={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold text-center whitespace-nowrap ${getAmountColor(item.amount)}`}>
                        {item.amount} adet
                      </span>
                      <div class="flex gap-2">
                        <button 
                          class="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md text-xs md:text-sm" 
                          onClick={() => useInventory(item.id)}
                        >
                          🔄 Kullan
                        </button>
                        <button 
                          class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md text-xs md:text-sm" 
                          onClick={() => deleteInventory(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                }</For>
              </div>
            }>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                <For each={paginatedInventory()}>{item =>
                  <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
                    <div class="text-center mb-3 md:mb-4">
                      <div class="text-4xl md:text-6xl mb-2">{getCategoryIcon(item.name)}</div>
                      <h3 class="font-bold text-sm md:text-lg text-gray-800 mb-1 truncate" title={item.name}>{item.name}</h3>
                      <p class="text-gray-600 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2" title={item.description || 'Özel eşya'}>
                        {item.description || 'Özel eşya'}
                      </p>
                    </div>
                    
                    <div class="text-center mb-3 md:mb-4">
                      <span class={`inline-block px-3 md:px-4 py-1 md:py-2 rounded-full text-sm md:text-lg font-bold ${getAmountColor(item.amount)}`}>
                        {item.amount} adet
                      </span>
                    </div>
                    
                    <div class="flex gap-2">
                      <button 
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md text-xs md:text-sm" 
                        onClick={() => useInventory(item.id)}
                      >
                        🔄 Kullan
                      </button>
                      <button 
                        class="bg-red-500 hover:bg-red-600 text-white px-2 md:px-3 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md text-xs md:text-sm" 
                        onClick={() => deleteInventory(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                }</For>
              </div>
            </Show>
          </div>
        }>
          <div class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-4">📭</div>
            <p class="text-lg">Envanter boş</p>
            <p class="text-sm">
              {invSearch() ? 'Arama kriterlerinize uygun öğe bulunamadı' : 'Ödül satın alarak envantere öğe ekleyebilirsin!'}
            </p>
          </div>
        </Show>
      </div>

      {/* Pagination */}
      <Show when={totalPages() > 1}>
        <div class="flex flex-col sm:flex-row justify-center items-center gap-3 bg-white rounded-lg p-3 md:p-4 shadow-md">
          <div class="flex items-center gap-2 order-2 sm:order-1">
            <button 
              class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm" 
              onClick={() => goToPage(currentPage() - 1)}
              disabled={currentPage() === 1}
            >
              ← Önceki
            </button>
            
            <div class="flex gap-1 overflow-x-auto scrollbar-hide">
              <For each={Array.from({length: Math.min(5, totalPages())}, (_, i) => {
                const startPage = Math.max(1, currentPage() - 2)
                return startPage + i
              }).filter(page => page <= totalPages())}>{page =>
                <button 
                  class={`px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                    currentPage() === page 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              }</For>
            </div>
            
            <button 
              class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm" 
              onClick={() => goToPage(currentPage() + 1)}
              disabled={currentPage() === totalPages()}
            >
              Sonraki →
            </button>
          </div>
          
          <div class="text-xs md:text-sm text-gray-600 text-center order-1 sm:order-2">
            Sayfa {currentPage()} / {totalPages()} 
            <span class="hidden sm:inline">
              ({sortedInventory().length} öğe)
            </span>
          </div>
        </div>
      </Show>
    </div>
  )
}
