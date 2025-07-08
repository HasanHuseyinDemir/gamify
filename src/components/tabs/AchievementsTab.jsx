import { For, Show, createSignal, createMemo } from 'solid-js'

export default function AchievementsTab(props) {
  const {
    achievements, isAchievementCompleted, achievementSearch, setAchievementSearch,
    achievementAttr, setAchievementAttr, achievementName, setAchievementName,
    achievementDesc, setAchievementDesc, achievementCriteria, setAchievementCriteria,
    achievementPrestige, setAchievementPrestige, addAchievement, filteredAchievementsList, 
    editAchievementId, setEditAchievementId, editAchievementName, setEditAchievementName, 
    editAchievementDesc, setEditAchievementDesc, editAchievementCriteria, setEditAchievementCriteria,
    editAchievementPrestige, setEditAchievementPrestige,
    deleteAchievement, getUserPoints, prestigeSettings
  } = props

  // Sayfalama
  const [currentPage, setCurrentPage] = createSignal(1)
  const [itemsPerPage, setItemsPerPage] = createSignal(8)
  const [sortBy, setSortBy] = createSignal('status') // status, name, progress
  const [viewMode, setViewMode] = createSignal('grid') // grid, list
  const [filterBy, setFilterBy] = createSignal('all') // all, earned, notEarned

  // Filtrelenmiş ve sıralanmış başarılar
  const sortedAchievements = createMemo(() => {
    let filtered = [...(filteredAchievementsList() || [])]
    
    // Durum filtresi
    if (filterBy() === 'earned') {
      filtered = filtered.filter(a => isAchievementCompleted(a))
    } else if (filterBy() === 'notEarned') {
      filtered = filtered.filter(a => !isAchievementCompleted(a))
    }
    
    // Sıralama
    switch (sortBy()) {
      case 'status':
        filtered.sort((a, b) => {
          const aEarned = isAchievementCompleted(a) ? 1 : 0
          const bEarned = isAchievementCompleted(b) ? 1 : 0
          return bEarned - aEarned
        })
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'progress':
        filtered.sort((a, b) => {
          const aProgress = getAchievementProgress(a)
          const bProgress = getAchievementProgress(b)
          return bProgress - aProgress
        })
        break
    }
    
    return filtered
  })

  // Sayfalanmış başarılar
  const paginatedAchievements = createMemo(() => {
    const start = (currentPage() - 1) * itemsPerPage()
    const end = start + itemsPerPage()
    return sortedAchievements().slice(start, end)
  })

  const totalPages = createMemo(() => 
    Math.ceil(sortedAchievements().length / itemsPerPage())
  )

  // Sayfa değiştirme
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page)
    }
  }

  // Başarı ilerlemesi hesapla
  const getAchievementProgress = (achievement) => {
    const criteria = (achievement.criteria || "").split(',').map(c => c.trim()).filter(Boolean)
    if (criteria.length === 0) return 0
    
    let totalProgress = 0
    criteria.forEach(c => {
      const [attr, value] = c.split(':')
      if (attr && value) {
        const userPoints = getUserPoints(attr.trim())
        const required = Number(value.trim())
        const progress = Math.min(userPoints / required, 1) * 100
        totalProgress += progress
      }
    })
    
    return Math.round(totalProgress / criteria.length)
  }

  // Başarı kategorisi ikonu
  const getAchievementIcon = (name, earned) => {
    const lower = name.toLowerCase()
    if (lower.includes('temizlik')) return earned ? '🧽✨' : '🧹'
    if (lower.includes('egzersiz') || lower.includes('spor')) return earned ? '💪🏆' : '🏃'
    if (lower.includes('öğren') || lower.includes('ders')) return earned ? '🎓📚' : '📖'
    if (lower.includes('yemek') || lower.includes('aşçı')) return earned ? '👨‍🍳🌟' : '🍳'
    if (lower.includes('para') || lower.includes('puan')) return earned ? '💰👑' : '💸'
    if (lower.includes('hafta') || lower.includes('gün')) return earned ? '📅✅' : '⏰'
    if (lower.includes('seviye') || lower.includes('level')) return earned ? '🏆🎯' : '📈'
    return earned ? '🏆🌟' : '🎯'
  }

  // Başarı zorluğu
  const getDifficultyLevel = (criteria) => {
    const cost = (criteria || "").split(',').reduce((sum, c) => {
      const [, value] = c.split(':')
      return sum + (Number(value) || 0)
    }, 0)
    
    if (cost >= 5000) return { level: 'Efsanevi', color: 'from-purple-500 to-pink-500', icon: '👑' }
    if (cost >= 2000) return { level: 'Zor', color: 'from-red-500 to-orange-500', icon: '🔥' }
    if (cost >= 1000) return { level: 'Orta', color: 'from-yellow-500 to-orange-500', icon: '⭐' }
    if (cost >= 500) return { level: 'Kolay', color: 'from-green-500 to-blue-500', icon: '🌱' }
    return { level: 'Başlangıç', color: 'from-gray-400 to-gray-500', icon: '🎯' }
  }

  // Kriter formatla
  const formatCriteria = (criteria) => {
    if (!criteria) return []
    return criteria.split(',').map(c => c.trim()).filter(Boolean)
  }

  return (
    <div class="space-y-6">
      {/* Başlık */}
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">
          🏆 Başarılar
        </h1>
        <p class="text-gray-600">Hedeflerini belirle, başarılarını takip et ve ödüllerini topla!</p>
      </div>

      {/* İstatistik Özeti */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-green-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">✅</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Kazanılan</div>
              <div class="text-lg md:text-xl font-bold text-green-600 truncate">
                {achievements().filter(a => isAchievementCompleted(a)).length}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-gray-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">⏳</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Bekleyen</div>
              <div class="text-lg md:text-xl font-bold text-gray-600 truncate">
                {achievements().filter(a => !isAchievementCompleted(a)).length}
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-orange-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">📊</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Toplam</div>
              <div class="text-lg md:text-xl font-bold text-orange-600 truncate">{achievements().length}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-purple-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">🎯</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Başarı Oranı</div>
              <div class="text-lg md:text-xl font-bold text-purple-600 truncate">
                {achievements().length > 0 
                  ? Math.round((achievements().filter(a => isAchievementCompleted(a)).length / achievements().length) * 100)
                  : 0
                }%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Başarı Ekleme Formu */}
      <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 shadow-lg">
        <h2 class="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
          ✨ Yeni Başarı Ekle
        </h2>
        <form class="space-y-4" onSubmit={addAchievement}>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input 
              class="border-2 border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all placeholder-gray-400" 
              value={achievementName()} 
              onInput={e => setAchievementName(e.target.value)} 
              placeholder="🎯 Başarı adı (örn: Temizlik Uzmanı)" 
              required 
            />
            <input 
              class="border-2 border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all placeholder-gray-400" 
              value={achievementDesc()} 
              onInput={e => setAchievementDesc(e.target.value)} 
              placeholder="📝 Açıklama" 
            />
            <div class="space-y-1">
              <input 
                class="w-full border-2 border-orange-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all placeholder-gray-400" 
                value={achievementCriteria()} 
                onInput={e => setAchievementCriteria(e.target.value)} 
                placeholder="⭐ Kriter (örn: temizlik:100,egzersiz:50)" 
                required 
              />
              <div class="text-xs text-gray-600">
                💡 Format: <code>skill:hedef_puan</code> (TÜM kriterler sağlanmalı)
              </div>
            </div>
            <div class="space-y-1">
              <input 
                class="w-full border-2 border-yellow-200 p-3 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder-gray-400" 
                type="number"
                min="1"
                max="1000"
                value={achievementPrestige()} 
                onInput={e => setAchievementPrestige(e.target.value)} 
                placeholder={`🏆 Prestij Puanı (varsayılan: ${prestigeSettings ? prestigeSettings().pointsPerAchievement : 10})`}
              />
              <div class="text-xs text-gray-600">
                🎯 Başarı tamamlandığında kazanılacak prestij puanı (1-1000)
              </div>
            </div>
          </div>
          <button 
            class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-3 font-bold text-lg hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl" 
            type="submit"
          >
            🎉 Başarı Ekle
          </button>
        </form>
      </div>

      {/* Kontroller */}
      <div class="bg-white rounded-lg p-4 shadow-md">
        <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div class="flex flex-col md:flex-row gap-3 flex-1">
            <input 
              class="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" 
              value={achievementSearch()} 
              onInput={e => setAchievementSearch(e.target.value)} 
              placeholder="🔍 İsme göre ara..." 
            />
            <input 
              class="flex-1 border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" 
              value={achievementAttr()} 
              onInput={e => setAchievementAttr(e.target.value)} 
              placeholder="⭐ Niteliğe göre ara (örn: temizlik)" 
            />
          </div>
          
          <div class="flex gap-2 items-center">
            <select 
              class="border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
              value={filterBy()} 
              onInput={e => setFilterBy(e.target.value)}
            >
              <option value="all">🎯 Tümü</option>
              <option value="earned">✅ Kazanılan</option>
              <option value="notEarned">⏳ Bekleyen</option>
            </select>
            
            <select 
              class="border-2 border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
              value={sortBy()} 
              onInput={e => setSortBy(e.target.value)}
            >
              <option value="status">📈 Duruma göre</option>
              <option value="name">📝 İsme göre</option>
              <option value="progress">📊 İlerlemeye göre</option>
            </select>
            
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button 
                class={`p-2 rounded transition-all ${viewMode() === 'grid' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600'}`}
                onClick={() => setViewMode('grid')}
                title="Kart görünümü"
              >
                ⊞
              </button>
              <button 
                class={`p-2 rounded transition-all ${viewMode() === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-600'}`}
                onClick={() => setViewMode('list')}
                title="Liste görünümü"
              >
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Başarılar Listesi */}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            🏆 Başarılar Salonu
            <span class="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {sortedAchievements().length} başarı
            </span>
          </h2>
        </div>

        <Show when={paginatedAchievements().length === 0} fallback={
          <div class="p-6">
            <Show when={viewMode() === 'grid'} fallback={
              <div class="space-y-4">
                <For each={paginatedAchievements()}>{achievement => {
                  const earned = isAchievementCompleted(achievement)
                  const progress = getAchievementProgress(achievement)
                  const difficulty = getDifficultyLevel(achievement.criteria)
                  const criteria = formatCriteria(achievement.criteria)
                  
                  return (
                    <Show when={editAchievementId() === achievement.id} fallback={
                      <div class={`p-4 rounded-lg border-2 transition-all ${
                        earned ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-4 flex-1">
                            <div class="text-5xl">{getAchievementIcon(achievement.name, earned)}</div>
                            <div class="flex-1">
                              <div class="flex items-center gap-2 mb-1">
                                <h3 class={`font-bold text-xl ${earned ? 'text-green-700' : 'text-gray-700'}`}>
                                  {achievement.name}
                                </h3>
                                <span class={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${difficulty.color} text-white`}>
                                  {difficulty.icon} {difficulty.level}
                                </span>
                                <span class="px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                  🏆 {achievement.prestigePoints || prestigeSettings?.().pointsPerAchievement || 10}
                                </span>
                              </div>
                              
                              <p class="text-gray-600 mb-2">{achievement.description || 'Özel başarı'}</p>
                              
                              {earned && achievement.earnedDate && (
                                <div class="text-sm text-green-600 mb-2">
                                  🎉 Kazanıldı: {new Date(achievement.earnedDate).toLocaleDateString('tr-TR')}
                                </div>
                              )}
                              
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
                              
                              <div class="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  class={`h-2 rounded-full transition-all duration-500 ${
                                    earned ? 'bg-green-500' : 'bg-orange-500'
                                  }`}
                                  style={`width: ${progress}%`}
                                ></div>
                              </div>
                              <div class="text-xs text-gray-600 mt-1">İlerleme: %{progress}</div>
                            </div>
                          </div>
                          
                          <div class="flex gap-2">
                            <button 
                              class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md" 
                              onClick={() => startEditAchievement(achievement)}
                            >
                              ✏️ Düzenle
                            </button>
                            <button 
                              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md" 
                              onClick={() => deleteAchievement(achievement.id)}
                            >
                              🗑️ Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    }>
                      <div class="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                        <form class="space-y-4" onSubmit={saveEditAchievement}>
                          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input 
                              class="border-2 border-blue-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400" 
                              value={editAchievementName()} 
                              onInput={e => setEditAchievementName(e.target.value)} 
                              required 
                            />
                            <input 
                              class="border-2 border-blue-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400" 
                              value={editAchievementDesc()} 
                              onInput={e => setEditAchievementDesc(e.target.value)} 
                            />
                            <input 
                              class="border-2 border-blue-200 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400" 
                              value={editAchievementCriteria()} 
                              onInput={e => setEditAchievementCriteria(e.target.value)} 
                              required 
                            />
                            <input 
                              class="border-2 border-yellow-200 p-2 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400" 
                              type="number"
                              min="1"
                              value={editAchievementPrestige()} 
                              onInput={e => setEditAchievementPrestige(e.target.value)} 
                              placeholder="🏆 Prestij Puanı"
                            />
                          </div>
                          <div class="flex gap-2">
                            <button 
                              class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all" 
                              type="submit"
                            >
                              ✅ Kaydet
                            </button>
                            <button 
                              class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all" 
                              type="button" 
                              onClick={() => setEditAchievementId(null)}
                            >
                              ❌ Vazgeç
                            </button>
                          </div>
                        </form>
                      </div>
                    </Show>
                  )
                }}</For>
              </div>
            }>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <For each={paginatedAchievements()}>{achievement => {
                  const earned = isAchievementCompleted(achievement)
                  const progress = getAchievementProgress(achievement)
                  const difficulty = getDifficultyLevel(achievement.criteria)
                  const criteria = formatCriteria(achievement.criteria)
                  
                  return (
                    <Show when={editAchievementId() !== achievement.id}>
                      <div class={`bg-gradient-to-br ${
                        earned ? 'from-green-400 to-emerald-500' : 'from-gray-300 to-gray-400'
                      } rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-white`}>
                        <div class="text-center mb-4">
                          <div class="text-6xl mb-3">{getAchievementIcon(achievement.name, earned)}</div>
                          <div class="flex justify-center gap-2 mb-2">
                            <span class={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${difficulty.color} text-white`}>
                              {difficulty.icon} {difficulty.level}
                            </span>
                            <span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                              🏆 {achievement.prestigePoints || prestigeSettings?.().pointsPerAchievement || 10}
                            </span>
                          </div>
                          <h3 class="font-bold text-xl mb-1">{achievement.name}</h3>
                          <p class="text-sm opacity-90 mb-3">{achievement.description || 'Özel başarı'}</p>
                        </div>
                        
                        {earned && achievement.earnedDate && (
                          <div class="text-center text-sm opacity-90 mb-3">
                            🎉 {new Date(achievement.earnedDate).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                        
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
                        
                        <div class="mb-4">
                          <div class="w-full bg-black bg-opacity-20 rounded-full h-2">
                            <div 
                              class="bg-white h-2 rounded-full transition-all duration-500"
                              style={`width: ${progress}%`}
                            ></div>
                          </div>
                          <div class="text-center text-sm opacity-90 mt-1">%{progress}</div>
                        </div>
                        
                        <div class="flex gap-2">
                          <button 
                            class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 rounded-lg font-medium transition-all" 
                            onClick={() => startEditAchievement(achievement)}
                          >
                            ✏️ Düzenle
                          </button>
                          <button 
                            class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-all" 
                            onClick={() => deleteAchievement(achievement.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </Show>
                  )
                }}</For>
              </div>
            </Show>
          </div>
        }>
          <div class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-4">🎯</div>
            <p class="text-lg">Henüz başarı bulunamadı</p>
            <p class="text-sm">
              {achievementSearch() || achievementAttr() ? 'Arama kriterlerinize uygun başarı yok' : 'İlk başarınızı ekleyerek başlayın!'}
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
                    ? 'bg-orange-500 text-white shadow-md' 
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
            ({sortedAchievements().length} başarı)
          </div>
        </div>
      </Show>
    </div>
  )
}

