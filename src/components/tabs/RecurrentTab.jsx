import { For, createSignal } from 'solid-js'

export default function RecurrentTab(props) {
  const {
    recName, setRecName, recDesc, setRecDesc, recPoints, setRecPoints,
    addRecurrent, recSearch, setRecSearch, filteredRecurrents,
    applyRecurrent, deleteRecurrent
  } = props

  const [currentPage, setCurrentPage] = createSignal(1)
  const [itemsPerPage] = createSignal(8)
  const [viewMode, setViewMode] = createSignal('grid') // 'grid' veya 'list'
  const [sortBy, setSortBy] = createSignal('name') // 'name', 'applied', 'date'
  const [sortOrder, setSortOrder] = createSignal('asc') // 'asc' veya 'desc'

  const allRecurrents = () => filteredRecurrents() || []
  
  // Sıralama
  const sortedRecurrents = () => {
    const sorted = [...allRecurrents()].sort((a, b) => {
      let aVal, bVal
      switch (sortBy()) {
        case 'applied':
          aVal = a.applied || 0
          bVal = b.applied || 0
          break
        case 'date':
          aVal = new Date(a.createdAt || 0)
          bVal = new Date(b.createdAt || 0)
          break
        default:
          aVal = a.name?.toLowerCase() || ''
          bVal = b.name?.toLowerCase() || ''
      }
      
      if (sortOrder() === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    })
    return sorted
  }

  // Pagination
  const totalPages = () => Math.ceil(sortedRecurrents().length / itemsPerPage())
  const paginatedRecurrents = () => {
    const start = (currentPage() - 1) * itemsPerPage()
    const end = start + itemsPerPage()
    return sortedRecurrents().slice(start, end)
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page)
    }
  }

  // İstatistikler
  const totalRecurrents = () => allRecurrents().length
  const totalApplied = () => allRecurrents().reduce((sum, item) => sum + (item.applied || 0), 0)
  const mostUsed = () => {
    if (allRecurrents().length === 0) return null
    return allRecurrents().reduce((prev, current) => 
      (current.applied || 0) > (prev.applied || 0) ? current : prev
    )
  }

  // Eylem kategorileri için ikonlar
  const getCategoryIcon = (points) => {
    const skills = Object.keys(points || {})
    if (skills.includes('fizik') || skills.includes('spor')) return '🏃‍♂️'
    if (skills.includes('zihin') || skills.includes('öğrenme')) return '🧠'
    if (skills.includes('temizlik') || skills.includes('düzen')) return '🧹'
    if (skills.includes('sosyal') || skills.includes('iletişim')) return '👥'
    if (skills.includes('yaratıcılık') || skills.includes('sanat')) return '🎨'
    if (skills.includes('sağlık') || skills.includes('beslenme')) return '🍎'
    return '⚡'
  }

  return (
    <div class="space-y-6">
      {/* Başlık */}
      <div class="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 class="text-3xl font-bold mb-2">🔄 Tekrarlı Eylemler</h1>
        <p class="text-pink-100">Günlük rutinlerinizi tanımlayın ve hızlıca uygulayın</p>
      </div>

      {/* İstatistik Kartları */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div class="bg-white rounded-lg p-3 md:p-4 shadow border-l-4 border-pink-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">📝</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs md:text-sm text-gray-600 truncate">Toplam Eylem</p>
              <p class="text-lg md:text-2xl font-bold text-pink-600 truncate">{totalRecurrents()}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow border-l-4 border-purple-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">🔥</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs md:text-sm text-gray-600 truncate">Toplam Uygulama</p>
              <p class="text-lg md:text-2xl font-bold text-purple-600 truncate">{totalApplied()}</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow border-l-4 border-indigo-500 lg:col-span-2 xl:col-span-1">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">⭐</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs md:text-sm text-gray-600 truncate">En Çok Kullanılan</p>
              <p class="text-sm md:text-lg font-semibold text-indigo-600 truncate" title={mostUsed()?.name || 'Henüz yok'}>
                {mostUsed()?.name || 'Henüz yok'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div class="bg-white rounded-lg shadow p-4 md:p-6">
        <h2 class="text-lg md:text-xl font-bold mb-4 text-gray-800 flex items-center">
          <span class="text-xl md:text-2xl mr-2">➕</span>
          Yeni Eylem Ekle
        </h2>
        <form class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4" onSubmit={addRecurrent}>
          <div class="space-y-1">
            <label class="text-xs md:text-sm font-medium text-gray-700">Eylem Adı</label>
            <input 
              class="w-full px-2 md:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm md:text-base" 
              value={recName()} 
              onInput={e=>setRecName(e.target.value)} 
              placeholder="Örn: Sabah Koşusu" 
              required 
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Açıklama</label>
            <input 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
              value={recDesc()} 
              onInput={e=>setRecDesc(e.target.value)} 
              placeholder="Kısa açıklama" 
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Puanlar</label>
            <input 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
              value={recPoints()} 
              onInput={e=>setRecPoints(e.target.value)} 
              placeholder="fizik:10,zihin:5" 
              required 
            />
            <div class="text-xs text-gray-600">
              💡 Format: <code>skill:puan</code> (virgülle ayırın, negatif de geçerli)
            </div>
          </div>
          <div class="flex items-end">
            <button 
              class="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center" 
              type="submit"
            >
              <span class="mr-2">➕</span>
              Ekle
            </button>
          </div>
        </form>
      </div>

      {/* Arama ve Kontroller */}
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div class="flex-1 max-w-md">
            <div class="relative">
              <input 
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                value={recSearch()} 
                onInput={e=>setRecSearch(e.target.value)} 
                placeholder="Eylem ara..." 
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-2 items-center">
            {/* Görünüm Modu */}
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button 
                class={`px-3 py-1 rounded-md text-sm font-medium transition ${viewMode() === 'grid' ? 'bg-white shadow text-pink-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('grid')}
              >
                🔷 Kart
              </button>
              <button 
                class={`px-3 py-1 rounded-md text-sm font-medium transition ${viewMode() === 'list' ? 'bg-white shadow text-pink-600' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setViewMode('list')}
              >
                📋 Liste
              </button>
            </div>

            {/* Sıralama */}
            <select 
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              value={sortBy()}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name">📝 İsim</option>
              <option value="applied">🔥 Kullanım</option>
              <option value="date">📅 Tarih</option>
            </select>

            <button 
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              onClick={() => setSortOrder(sortOrder() === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder() === 'asc' ? '⬆️' : '⬇️'}
            </button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div class="bg-white rounded-lg shadow p-6">
        {paginatedRecurrents().length === 0 ? (
          <div class="text-center py-12">
            <div class="text-6xl mb-4">🔄</div>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">Henüz tekrarlı eylem yok</h3>
            <p class="text-gray-500">Günlük rutinlerinizi ekleyerek başlayın!</p>
          </div>
        ) : (
          <>
            <div class={viewMode() === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              <For each={paginatedRecurrents()}>{item => (
                <div class={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                  viewMode() === 'grid' 
                    ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200' 
                    : 'bg-gray-50 border-gray-200 flex items-center justify-between'
                }`}>
                  
                  {viewMode() === 'grid' ? (
                    // Kart Görünümü
                    <>
                      <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center">
                          <span class="text-2xl mr-2">{getCategoryIcon(item.points)}</span>
                          <h3 class="font-bold text-gray-800 text-lg">{item.name}</h3>
                        </div>
                        <span class="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">
                          {item.applied || 0}x
                        </span>
                      </div>
                      
                      {item.description && (
                        <p class="text-gray-600 text-sm mb-3">{item.description}</p>
                      )}
                      
                      <div class="mb-4">
                        <div class="flex flex-wrap gap-1">
                          <For each={Object.entries(item.points || {})}>{([skill, points]) => (
                            <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                              {skill}: +{points}
                            </span>
                          )}</For>
                        </div>
                      </div>
                      
                      <div class="flex gap-2">
                        <button 
                          class="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
                          onClick={() => applyRecurrent(item)}
                        >
                          <span class="mr-1">⚡</span>
                          Uygula
                        </button>
                        <button 
                          class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-all duration-200"
                          onClick={() => deleteRecurrent(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  ) : (
                    // Liste Görünümü
                    <>
                      <div class="flex items-center flex-1 min-w-0">
                        <span class="text-xl mr-3">{getCategoryIcon(item.points)}</span>
                        <div class="flex-1 min-w-0">
                          <h3 class="font-semibold text-gray-800">{item.name}</h3>
                          <div class="flex items-center gap-2 text-sm text-gray-500">
                            <span>{item.applied || 0} kez uygulandı</span>
                            <div class="flex gap-1">
                              <For each={Object.entries(item.points || {})}>{([skill, points]) => (
                                <span class="bg-blue-100 text-blue-600 px-1 py-0.5 rounded text-xs">
                                  {skill}:+{points}
                                </span>
                              )}</For>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex gap-2 flex-shrink-0">
                        <button 
                          class="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                          onClick={() => applyRecurrent(item)}
                        >
                          <span class="mr-1">⚡</span>
                          Uygula
                        </button>
                        <button 
                          class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-all duration-200"
                          onClick={() => deleteRecurrent(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                  
                </div>
              )}</For>
            </div>

            {/* Pagination */}
            {totalPages() > 1 && (
              <div class="flex justify-center items-center mt-6 space-x-2">
                <button 
                  class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  onClick={() => goToPage(currentPage() - 1)}
                  disabled={currentPage() === 1}
                >
                  ⬅️
                </button>
                
                <For each={Array.from({length: Math.min(5, totalPages())}, (_, i) => {
                  const start = Math.max(1, currentPage() - 2)
                  const end = Math.min(totalPages(), start + 4)
                  return start + i <= end ? start + i : null
                }).filter(Boolean)}>{pageNum => (
                  <button 
                    class={`px-3 py-2 rounded-lg transition ${
                      currentPage() === pageNum 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )}</For>
                
                <button 
                  class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  onClick={() => goToPage(currentPage() + 1)}
                  disabled={currentPage() === totalPages()}
                >
                  ➡️
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
