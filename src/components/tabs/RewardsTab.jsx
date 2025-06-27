import { For, Show, createSignal, createMemo } from 'solid-js'

export default function RewardsTab(props) {
  const {
    rewardSearch, setRewardSearch, rewardAttr, setRewardAttr,
    rewardOnlyEligible, setRewardOnlyEligible, rewardMsg,
    rewardName, setRewardName, rewardDesc, setRewardDesc,
    rewardCriteria, setRewardCriteria, addReward, filteredRewards,
    isRewardEligible, getUserPoints, buyReward, deleteReward
  } = props

  // Sayfalama
  const [currentPage, setCurrentPage] = createSignal(1)
  const [itemsPerPage, setItemsPerPage] = createSignal(8)
  const [sortBy, setSortBy] = createSignal('name') // name, cost, eligible
  const [viewMode, setViewMode] = createSignal('grid') // grid, list

  // Sıralanmış ödüller
  const sortedRewards = createMemo(() => {
    let sorted = [...(filteredRewards() || [])]
    
    switch (sortBy()) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'cost':
        sorted.sort((a, b) => {
          const aCost = getCost(a.criteria)
          const bCost = getCost(b.criteria)
          return bCost - aCost
        })
        break
      case 'eligible':
        sorted.sort((a, b) => {
          const aEligible = isRewardEligible(a.criteria) ? 1 : 0
          const bEligible = isRewardEligible(b.criteria) ? 1 : 0
          return bEligible - aEligible
        })
        break
    }
    
    return sorted
  })

  // Sayfalanmış ödüller
  const paginatedRewards = createMemo(() => {
    const start = (currentPage() - 1) * itemsPerPage()
    const end = start + itemsPerPage()
    return sortedRewards().slice(start, end)
  })

  const totalPages = createMemo(() => 
    Math.ceil(sortedRewards().length / itemsPerPage())
  )

  // Sayfa değiştirme
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page)
    }
  }

  // Ödül maliyetini hesapla
  const getCost = (criteria) => {
    if (!criteria) return 0
    const critArr = criteria.split(',').map(c => c.trim()).filter(Boolean)
    return critArr.reduce((sum, c) => {
      const [, value] = c.split(':')
      return sum + (Number(value) || 0)
    }, 0)
  }

  // Ödül kategorisi ikonu
  const getRewardIcon = (name, description) => {
    const text = (name + ' ' + description).toLowerCase()
    if (text.includes('temizlik') || text.includes('deterjan')) return '🧽'
    if (text.includes('yemek') || text.includes('pasta') || text.includes('kek')) return '🍰'
    if (text.includes('egzersiz') || text.includes('spor')) return '🏋️'
    if (text.includes('kitap') || text.includes('ders')) return '📚'
    if (text.includes('oyun') || text.includes('eğlence')) return '🎮'
    if (text.includes('tatil') || text.includes('gezi')) return '✈️'
    if (text.includes('para') || text.includes('money')) return '💰'
    if (text.includes('alışveriş') || text.includes('shopping')) return '🛍️'
    return '🎁'
  }

  // Uygunluk durumu rengi
  const getEligibilityColor = (eligible) => {
    return eligible 
      ? 'from-green-500 to-emerald-500' 
      : 'from-gray-400 to-gray-500'
  }

  // Kriter görüntüleme
  const formatCriteria = (criteria) => {
    if (!criteria) return []
    return criteria.split(',').map(c => c.trim()).filter(Boolean)
  }

  return (
    <div class="space-y-6">
      {/* Başlık */}
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 mb-2">
          🏆 Ödüller
        </h1>
        <p class="text-gray-600">Puanlarını harcayarak özel ödüller kazanabilirsin!</p>
      </div>

      {/* Mesaj Gösterimi */}
      <Show when={rewardMsg()}>
        <div class={`p-4 rounded-lg text-white font-semibold text-center animate-pulse ${
          rewardMsg().startsWith('Başarı') ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {rewardMsg().startsWith('Başarı') ? '🎉 ' : '❌ '}
          {rewardMsg()}
        </div>
      </Show>

      {/* İstatistikler */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-yellow-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">🎁</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Toplam Ödül</div>
              <div class="text-lg md:text-xl font-bold text-yellow-600 truncate">{sortedRewards().length}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-green-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">✅</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Uygun Ödül</div>
              <div class="text-lg md:text-xl font-bold text-green-600 truncate">
                {sortedRewards().filter(r => isRewardEligible(r.criteria)).length}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-red-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">⏳</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Uygun Değil</div>
              <div class="text-lg md:text-xl font-bold text-red-600 truncate">
                {sortedRewards().filter(r => !isRewardEligible(r.criteria)).length}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-purple-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">💰</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Ort. Maliyet</div>
              <div class="text-lg md:text-xl font-bold text-purple-600 truncate">
                {sortedRewards().length > 0 
                  ? Math.round(sortedRewards().reduce((sum, r) => sum + getCost(r.criteria), 0) / sortedRewards().length)
                  : 0
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ödül Ekleme Formu */}
      <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 md:p-6 border border-yellow-200 shadow-lg">
        <h2 class="text-lg md:text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
          ✨ Yeni Ödül Ekle
        </h2>
        <form class="space-y-4" onSubmit={addReward}>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <input 
              class="border-2 border-yellow-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder-gray-400 text-sm md:text-base" 
              value={rewardName()} 
              onInput={e => setRewardName(e.target.value)} 
              placeholder="🎁 Ödül adı (örn: Netflix aboneliği)" 
              required 
            />
            <input 
              class="border-2 border-yellow-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder-gray-400 text-sm md:text-base" 
              value={rewardDesc()} 
              onInput={e => setRewardDesc(e.target.value)} 
              placeholder="📝 Açıklama" 
            />
            <div class="space-y-1">
              <input 
                class="w-full border-2 border-yellow-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder-gray-400 text-sm md:text-base" 
                value={rewardCriteria()} 
                onInput={e => setRewardCriteria(e.target.value)} 
                placeholder="💰 Kriter (örn: temizlik:100,egzersiz:50)" 
                required 
              />
              <div class="text-xs text-gray-600">
                💡 Format: <code class="bg-yellow-100 px-1 rounded">skill:gereken_puan</code> (virgülle ayırın)
              </div>
            </div>
          </div>
          <button 
            class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-3 font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl" 
            type="submit"
          >
            🎉 Ödül Ekle
          </button>
        </form>
      </div>

      {/* Kontroller */}
      <div class="bg-white rounded-lg p-3 md:p-4 shadow-md mb-6">
        <div class="flex flex-col lg:flex-row gap-3 md:gap-4 items-stretch lg:items-center">
          <div class="flex flex-col sm:flex-row gap-2 md:gap-3 flex-1 min-w-0">
            <input 
              class="flex-1 border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all text-sm md:text-base min-w-0" 
              value={rewardSearch()} 
              onInput={e => setRewardSearch(e.target.value)} 
              placeholder="🔍 İsme göre ara..." 
            />
            <input 
              class="flex-1 border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all text-sm md:text-base min-w-0" 
              value={rewardAttr()} 
              onInput={e => setRewardAttr(e.target.value)} 
              placeholder="⭐ Niteliğe göre ara (örn: temizlik)" 
            />
            <label class="flex items-center gap-2 select-none bg-yellow-50 p-2 md:p-3 rounded-lg border-2 border-yellow-200 whitespace-nowrap">
              <input 
                type="checkbox" 
                checked={rewardOnlyEligible()} 
                onInput={e => setRewardOnlyEligible(e.target.checked)} 
                class="rounded"
              />
              <span class="font-medium text-yellow-700 text-sm md:text-base">Sadece uygunlar</span>
            </label>
          </div>
          
          <div class="flex gap-2 items-center justify-between sm:justify-start">
            <select 
              class="flex-1 sm:flex-none border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-sm md:text-base min-w-0" 
              value={sortBy()} 
              onInput={e => setSortBy(e.target.value)}
            >
              <option value="name">📝 İsme göre</option>
              <option value="cost">💰 Maliyete göre</option>
              <option value="eligible">✅ Uygunluğa göre</option>
            </select>
            
            <div class="flex bg-gray-100 rounded-lg p-1 shrink-0">
              <button 
                class={`p-2 rounded transition-all text-sm ${viewMode() === 'grid' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-600'}`}
                onClick={() => setViewMode('grid')}
                title="Kart görünümü"
              >
                ⊞
              </button>
              <button 
                class={`p-2 rounded transition-all text-sm ${viewMode() === 'list' ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-600'}`}
                onClick={() => setViewMode('list')}
                title="Liste görünümü"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ödüller Listesi */}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            🏪 Ödül Mağazası
            <span class="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {sortedRewards().length} ödül
            </span>
          </h2>
        </div>

        <Show when={paginatedRewards().length === 0} fallback={
          <div class="p-6">
            <Show when={viewMode() === 'grid'} fallback={
              <div class="space-y-4">
                <For each={paginatedRewards()}>{reward => {
                  const eligible = isRewardEligible(reward.criteria)
                  const criteria = formatCriteria(reward.criteria)
                  return (
                    <div class={`p-4 rounded-lg border-2 transition-all ${
                      eligible ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                    }`}>
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4 flex-1">
                          <div class="text-4xl">{getRewardIcon(reward.name, reward.description)}</div>
                          <div class="flex-1">
                            <h3 class="font-bold text-xl text-gray-800">{reward.name}</h3>
                            <p class="text-gray-600 mb-2">{reward.description || 'Özel ödül'}</p>
                            
                            <div class="flex flex-wrap gap-2 mb-2">
                              <For each={criteria}>{criterion => {
                                const [attr, value] = criterion.split(':')
                                const userPoints = getUserPoints(attr)
                                const required = Number(value)
                                const hasEnough = userPoints >= required
                                
                                return (
                                  <div class={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    hasEnough ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {attr}: {userPoints}/{required} {hasEnough ? '✅' : '❌'}
                                  </div>
                                )
                              }}</For>
                            </div>
                            
                            <div class="text-sm text-gray-500">
                              Toplam maliyet: {getCost(reward.criteria)} puan
                            </div>
                          </div>
                        </div>
                        
                        <div class="flex gap-2">
                          <Show when={eligible}>
                            <button 
                              class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 shadow-md" 
                              onClick={() => buyReward(reward)}
                            >
                              🛒 Satın Al
                            </button>
                          </Show>
                          <button 
                            class="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md" 
                            onClick={() => deleteReward(reward.id)}
                          >
                            🗑️ Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }}</For>
              </div>
            }>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <For each={paginatedRewards()}>{reward => {
                  const eligible = isRewardEligible(reward.criteria)
                  const criteria = formatCriteria(reward.criteria)
                  return (
                    <div class={`bg-gradient-to-br ${getEligibilityColor(eligible)} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-white`}>
                      <div class="text-center mb-4">
                        <div class="text-6xl mb-3">{getRewardIcon(reward.name, reward.description)}</div>
                        <h3 class="font-bold text-xl mb-1">{reward.name}</h3>
                        <p class="text-sm opacity-90 mb-3">{reward.description || 'Özel ödül'}</p>
                      </div>
                      
                      <div class="space-y-2 mb-4">
                        <For each={criteria}>{criterion => {
                          const [attr, value] = criterion.split(':')
                          const userPoints = getUserPoints(attr)
                          const required = Number(value)
                          const hasEnough = userPoints >= required
                          
                          return (
                            <div class="flex justify-between text-sm bg-white bg-opacity-20 rounded px-2 py-1">
                              <span>{attr}</span>
                              <span class={hasEnough ? 'text-green-200' : 'text-red-200'}>
                                {userPoints}/{required} {hasEnough ? '✅' : '❌'}
                              </span>
                            </div>
                          )
                        }}</For>
                      </div>
                      
                      <div class="text-center text-sm opacity-90 mb-4">
                        Toplam: {getCost(reward.criteria)} puan
                      </div>
                      
                      <div class="flex gap-2">
                        <Show when={eligible}>
                          <button 
                            class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 rounded-lg font-bold transition-all" 
                            onClick={() => buyReward(reward)}
                          >
                            🛒 Satın Al
                          </button>
                        </Show>
                        <button 
                          class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all" 
                          onClick={() => deleteReward(reward.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                }}</For>
              </div>
            </Show>
          </div>
        }>
          <div class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-4">🛍️</div>
            <p class="text-lg">Henüz ödül bulunamadı</p>
            <p class="text-sm">
              {rewardSearch() || rewardAttr() ? 'Arama kriterlerinize uygun ödül yok' : 'İlk ödülünüzü ekleyerek başlayın!'}
            </p>
          </div>
        </Show>
      </div>

      {/* Pagination */}
      <Show when={totalPages() > 1}>
        <div class="flex justify-center items-center gap-2 bg-white rounded-lg p-4 shadow-md">
          <button 
            class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
            onClick={() => goToPage(currentPage() - 1)}
            disabled={currentPage() === 1}
          >
            ← Önceki
          </button>
          
          <div class="flex gap-1">
            <For each={Array.from({length: Math.min(5, totalPages())}, (_, i) => {
              const startPage = Math.max(1, currentPage() - 2)
              return startPage + i
            }).filter(page => page <= totalPages())}>{page =>
              <button 
                class={`px-3 py-2 rounded-lg font-medium transition-all ${
                  currentPage() === page 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            }</For>
          </div>
          
          <button 
            class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
            onClick={() => goToPage(currentPage() + 1)}
            disabled={currentPage() === totalPages()}
          >
            Sonraki →
          </button>
          
          <div class="ml-4 text-sm text-gray-600">
            Sayfa {currentPage()} / {totalPages()} 
            ({sortedRewards().length} ödül)
          </div>
        </div>
      </Show>
    </div>
  )
}
