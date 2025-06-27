import { For, Show, createSignal, createMemo } from 'solid-js'

export default function AnalysisTab(props) {
  const {
    period, setPeriod, search, setSearch, attr, setAttr,
    analyticsTotal, filteredActions, editId, setEditId,
    editName, setEditName, editDescription, setEditDescription,
    editPoints, setEditPoints, startEdit, saveEdit, deleteAction,
    prestigePoints, getPrestigeLevel, prestigeSettings
  } = props

  // Analiz sekmesi state'i
  const [analysisTab, setAnalysisTab] = createSignal('overview')
  
  // Yeni state'ler
  const [chartType, setChartType] = createSignal('bar') // bar, pie, line
  const [timeRange, setTimeRange] = createSignal('7days') // 7days, 30days, 3months, 1year
  const [sortByValue, setSortByValue] = createSignal(false)

  // Gelişmiş istatistikler
  const getAdvancedStats = createMemo(() => {
    const actions = filteredActions()
    if (actions.length === 0) return null

    // Günlük ortalamalar
    const dates = {}
    actions.forEach(action => {
      const date = new Date(action.date).toDateString()
      if (!dates[date]) dates[date] = { count: 0, points: {} }
      dates[date].count++
      Object.entries(action.points || {}).forEach(([skill, points]) => {
        dates[date].points[skill] = (dates[date].points[skill] || 0) + points
      })
    })

    const dailyStats = Object.values(dates)
    const avgActionsPerDay = dailyStats.reduce((sum, day) => sum + day.count, 0) / dailyStats.length
    
    // En aktif gün
    const mostActiveDay = Object.entries(dates).reduce((max, [date, stats]) => 
      stats.count > (max.stats?.count || 0) ? { date, stats } : max, {}
    )

    // Streak hesaplama (ardışık günler)
    const sortedDates = Object.keys(dates).sort()
    let currentStreak = 0
    let maxStreak = 0
    let lastDate = null

    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr)
      if (lastDate) {
        const diffDays = Math.floor((date - lastDate) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          currentStreak++
        } else {
          maxStreak = Math.max(maxStreak, currentStreak)
          currentStreak = 1
        }
      } else {
        currentStreak = 1
      }
      lastDate = date
    })
    maxStreak = Math.max(maxStreak, currentStreak)

    // Skill dağılımı
    const skillDistribution = {}
    const skillTotal = analyticsTotal()
    const totalPoints = Object.values(skillTotal).reduce((sum, val) => sum + Math.max(0, val), 0)
    
    Object.entries(skillTotal).forEach(([skill, points]) => {
      skillDistribution[skill] = {
        points: Math.max(0, points),
        percentage: totalPoints > 0 ? Math.round((Math.max(0, points) / totalPoints) * 100) : 0
      }
    })

    // Trend analizi (son 7 günün karşılaştırması)
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      last7Days.push({
        date: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
        count: dates[dateStr]?.count || 0,
        points: Object.values(dates[dateStr]?.points || {}).reduce((sum, val) => sum + val, 0)
      })
    }

    return {
      avgActionsPerDay: Math.round(avgActionsPerDay * 10) / 10,
      mostActiveDay: mostActiveDay.date ? new Date(mostActiveDay.date).toLocaleDateString('tr-TR') : 'Henüz yok',
      mostActiveDayCount: mostActiveDay.stats?.count || 0,
      currentStreak,
      maxStreak,
      skillDistribution,
      last7Days,
      totalDays: dailyStats.length,
      totalActions: actions.length
    }
  })

  // Zaman aralığına göre filtreleme
  const getTimeFilteredActions = createMemo(() => {
    const now = new Date()
    let startDate
    
    switch (timeRange()) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        return filteredActions()
    }
    
    return filteredActions().filter(action => new Date(action.date) >= startDate)
  })

  // Leaderboard için skill sıralaması
  const getSkillLeaderboard = createMemo(() => {
    const total = analyticsTotal()
    const entries = Object.entries(total)
      .map(([skill, points]) => ({ skill, points: Math.max(0, points) }))
      .filter(entry => entry.points > 0)
    
    return sortByValue() 
      ? entries.sort((a, b) => b.points - a.points)
      : entries.sort((a, b) => a.skill.localeCompare(b.skill))
  })

  // Performans skorları
  const getPerformanceScore = createMemo(() => {
    const stats = getAdvancedStats()
    if (!stats) return { score: 0, grade: 'F', description: 'Veri yok' }
    
    let score = 0
    
    // Günlük aktivite (max 30 puan)
    score += Math.min(stats.avgActionsPerDay * 3, 30)
    
    // Streak (max 25 puan) 
    score += Math.min(stats.currentStreak * 2, 25)
    
    // Çeşitlilik (max 25 puan)
    const skillCount = Object.keys(stats.skillDistribution).length
    score += Math.min(skillCount * 3, 25)
    
    // Tutarlılık (max 20 puan)
    const consistency = stats.totalDays > 1 ? (stats.totalActions / stats.totalDays) : 0
    score += Math.min(consistency * 4, 20)
    
    score = Math.round(score)
    
    let grade, description
    if (score >= 90) { grade = 'A+'; description = 'Mükemmel!' }
    else if (score >= 80) { grade = 'A'; description = 'Harika!' }
    else if (score >= 70) { grade = 'B'; description = 'İyi!' }
    else if (score >= 60) { grade = 'C'; description = 'Orta' }
    else if (score >= 50) { grade = 'D'; description = 'Zayıf' }
    else { grade = 'F'; description = 'Geliştirilmeli' }
    
    return { score, grade, description }
  })

  // Seviye hesaplama algoritması - gittikçe zorlaşan XP sistemi
  const calculateLevel = createMemo(() => {
    const total = analyticsTotal()
    const totalXP = Object.values(total).reduce((sum, val) => sum + Math.max(0, val), 0)
    
    if (totalXP <= 0) return { 
      level: 1, 
      currentXP: 0, 
      nextLevelXP: 100, 
      progress: 0,
      totalXP: 0
    }
    
    let level = 1
    let xpForLevel = 100 // İlk level için 100 XP
    let totalXPUsed = 0
    
    while (totalXP >= totalXPUsed + xpForLevel) {
      totalXPUsed += xpForLevel
      level++
      // Her level %20 daha fazla XP gerektirir (gittikçe zorlaşır)
      xpForLevel = Math.floor(xpForLevel * 1.2)
    }
    
    const currentXP = totalXP - totalXPUsed
    const progress = Math.round((currentXP / xpForLevel) * 100)
    
    return {
      level,
      currentXP,
      nextLevelXP: xpForLevel,
      progress,
      totalXP
    }
  })

  // Seviye ikonları
  const getLevelIcon = (level) => {
    if (level >= 50) return '👑' // Kral
    if (level >= 40) return '🏆' // Şampiyon
    if (level >= 30) return '💎' // Elmas
    if (level >= 25) return '🥇' // Altın
    if (level >= 20) return '🥈' // Gümüş
    if (level >= 15) return '🥉' // Bronz
    if (level >= 10) return '⭐' // Yıldız
    if (level >= 5) return '🔥' // Ateş
    return '🌱' // Başlangıç
  }

  // Seviye renkleri
  const getLevelColor = (level) => {
    if (level >= 50) return 'from-yellow-400 to-orange-500'
    if (level >= 40) return 'from-purple-400 to-pink-500'
    if (level >= 30) return 'from-blue-400 to-cyan-500'
    if (level >= 25) return 'from-yellow-300 to-yellow-500'
    if (level >= 20) return 'from-gray-300 to-gray-500'
    if (level >= 15) return 'from-orange-300 to-orange-500'
    if (level >= 10) return 'from-green-300 to-green-500'
    if (level >= 5) return 'from-red-300 to-red-500'
    return 'from-green-200 to-green-400'
  }

  // Her skill için ayrı seviye hesaplama
  const calculateSkillLevel = (skillName) => {
    const total = analyticsTotal()
    const skillXP = total[skillName] || 0
    const totalXP = Math.max(0, skillXP)
    
    if (totalXP <= 0) return { 
      level: 1, 
      currentXP: 0, 
      nextLevelXP: 50, 
      progress: 0,
      totalXP: 0
    }
    
    let level = 1
    let xpForLevel = 50 // Skill levelleri daha düşük XP'den başlar
    let totalXPUsed = 0
    
    while (totalXP >= totalXPUsed + xpForLevel) {
      totalXPUsed += xpForLevel
      level++
      // Her skill level %15 daha fazla XP gerektirir
      xpForLevel = Math.floor(xpForLevel * 1.15)
    }
    
    const currentXP = totalXP - totalXPUsed
    const progress = Math.round((currentXP / xpForLevel) * 100)
    
    return {
      level,
      currentXP,
      nextLevelXP: xpForLevel,
      progress,
      totalXP
    }
  }

  // Skill'e göre özel ikonlar
  const getSkillIcon = (skillName, level) => {
    const icons = {
      // Temizlik skill ikonları
      'temizlik': {
        1: '🧹', 5: '🧽', 10: '✨', 15: '🏠', 20: '🏡', 25: '🏰', 30: '💎', 40: '👑', 50: '🌟'
      },
      // Egzersiz skill ikonları  
      'egzersiz': {
        1: '👟', 5: '💪', 10: '🏃', 15: '🏋️', 20: '🥇', 25: '🏆', 30: '⚡', 40: '🔥', 50: '🚀'
      },
      // Öğrenme skill ikonları
      'ogrenme': {
        1: '📚', 5: '📖', 10: '🎓', 15: '🧠', 20: '🔬', 25: '🎯', 30: '💡', 40: '🌟', 50: '🧙'
      },
      // Yemek skill ikonları
      'yemek': {
        1: '🍳', 5: '👨‍🍳', 10: '🍽️', 15: '🥘', 20: '🍰', 25: '🏆', 30: '👑', 40: '⭐', 50: '🌟'
      },
      // Çalışma skill ikonları
      'calisma': {
        1: '💼', 5: '💻', 10: '📊', 15: '🎯', 20: '📈', 25: '🏆', 30: '💎', 40: '👑', 50: '🚀'
      },
      // Varsayılan genel ikonlar
      'default': {
        1: '🌱', 5: '🔥', 10: '⭐', 15: '🥉', 20: '🥈', 25: '🥇', 30: '💎', 40: '🏆', 50: '👑'
      }
    }
    
    const skillIcons = icons[skillName.toLowerCase()] || icons.default
    
    if (level >= 50) return skillIcons[50]
    if (level >= 40) return skillIcons[40]
    if (level >= 30) return skillIcons[30]
    if (level >= 25) return skillIcons[25]
    if (level >= 20) return skillIcons[20]
    if (level >= 15) return skillIcons[15]
    if (level >= 10) return skillIcons[10]
    if (level >= 5) return skillIcons[5]
    return skillIcons[1]
  }

  // Skill'e göre özel renkler
  const getSkillColor = (skillName, level) => {
    const baseColors = {
      'temizlik': {
        low: 'from-blue-200 to-cyan-300',
        mid: 'from-blue-400 to-cyan-500', 
        high: 'from-blue-600 to-cyan-700',
        max: 'from-blue-800 to-cyan-900'
      },
      'egzersiz': {
        low: 'from-red-200 to-orange-300',
        mid: 'from-red-400 to-orange-500',
        high: 'from-red-600 to-orange-700', 
        max: 'from-red-800 to-orange-900'
      },
      'ogrenme': {
        low: 'from-green-200 to-emerald-300',
        mid: 'from-green-400 to-emerald-500',
        high: 'from-green-600 to-emerald-700',
        max: 'from-green-800 to-emerald-900'
      },
      'yemek': {
        low: 'from-yellow-200 to-amber-300',
        mid: 'from-yellow-400 to-amber-500',
        high: 'from-yellow-600 to-amber-700',
        max: 'from-yellow-800 to-amber-900'
      },
      'calisma': {
        low: 'from-purple-200 to-indigo-300',
        mid: 'from-purple-400 to-indigo-500', 
        high: 'from-purple-600 to-indigo-700',
        max: 'from-purple-800 to-indigo-900'
      },
      'default': {
        low: 'from-gray-200 to-slate-300',
        mid: 'from-gray-400 to-slate-500',
        high: 'from-gray-600 to-slate-700',
        max: 'from-gray-800 to-slate-900'
      }
    }
    
    const colors = baseColors[skillName.toLowerCase()] || baseColors.default
    
    if (level >= 30) return colors.max
    if (level >= 15) return colors.high  
    if (level >= 5) return colors.mid
    return colors.low
  }

  return (
    <div class="space-y-6">
      {/* Başlık */}
      <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
        <h1 class="text-3xl font-bold mb-2">📊 Analiz & İstatistikler</h1>
        <p class="text-purple-100">Performansınızı detaylı olarak inceleyin</p>
      </div>
      
      {/* Analiz Tab Menüsü */}
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button 
            class={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              analysisTab() === 'overview' 
                ? 'bg-purple-500 text-white shadow-md' 
                : 'text-purple-600 hover:bg-purple-100'
            }`}
            onClick={() => setAnalysisTab('overview')}
          >
            📊 Genel Bakış
          </button>
          <button 
            class={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              analysisTab() === 'levels' 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md' 
                : 'text-orange-600 hover:bg-orange-100'
            }`}
            onClick={() => setAnalysisTab('levels')}
          >
            🏆 Genel Seviye
          </button>
          <button 
            class={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              analysisTab() === 'skills' 
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md' 
                : 'text-emerald-600 hover:bg-emerald-100'
            }`}
            onClick={() => setAnalysisTab('skills')}
          >
            🎯 Skill Seviyeleri
          </button>
          <button 
            class={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              analysisTab() === 'trends' 
                ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white shadow-md' 
                : 'text-blue-600 hover:bg-blue-100'
            }`}
            onClick={() => setAnalysisTab('trends')}
          >
            📈 Trendler
          </button>
          <button 
            class={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              analysisTab() === 'performance' 
                ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-md' 
                : 'text-pink-600 hover:bg-pink-100'
            }`}
            onClick={() => setAnalysisTab('performance')}
          >
            🎯 Performans
          </button>
          <button 
            class={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              analysisTab() === 'logs' 
                ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setAnalysisTab('logs')}
          >
            📝 Eylem Geçmişi
          </button>
        </div>
      </div>

      <Show when={analysisTab() === 'overview'}>
        <div class="space-y-4">
          <div class="flex flex-col md:flex-row gap-2 mb-2">
            <select class="border p-2 rounded" value={period()} onInput={e => setPeriod(e.target.value)}>
              <option value="all">Tümü</option>
              <option value="today">Bugün</option>
              <option value="week">Bu Hafta</option>
              <option value="month">Bu Ay</option>
            </select>
            <input class="border p-2 rounded flex-1" value={search()} onInput={e => setSearch(e.target.value)} placeholder="Görev/Log arama" />
            <input class="border p-2 rounded flex-1" value={attr()} onInput={e => setAttr(e.target.value)} placeholder="Nitelik (puan tipi) ara" />
          </div>
          <div class="text-sm text-gray-700 mb-2">Toplamlar:</div>
          <ul class="flex flex-wrap gap-2 mb-2">
            <For each={Object.entries(analyticsTotal())}>{([k,v]) =>
              <li class="bg-purple-100 text-purple-700 px-3 py-1 rounded font-semibold">{k}: {v}</li>
            }</For>
          </ul>
          <div class="text-sm text-gray-700 mb-2">Filtrelenmiş Loglar:</div>
          <ul class="space-y-2">
            <For each={filteredActions()}>{action =>
              <li class="bg-gray-50 rounded p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <Show when={editId() === action.id} fallback={
                  <>
                    <div>
                      <div class="font-bold text-blue-700">{action.name}</div>
                      <div class="text-xs text-gray-500">Tarih: {new Date(action.date).toLocaleString()}</div>
                      <div class="text-xs text-gray-500">Puanlar: {Object.entries(action.points).map(([k,v]) => `${k}:${v}`).join(', ')}</div>
                      <div class="text-xs text-gray-400">Açıklama: {action.description}</div>
                    </div>
                    <div class="flex gap-2 mt-2 md:mt-0">
                      <button class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => startEdit(action)}>Düzenle</button>
                      <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" onClick={() => deleteAction(action.id)}>Sil</button>
                    </div>
                  </>
                }>
                  <form class="flex flex-col md:flex-row gap-2 w-full" onSubmit={saveEdit}>
                    <input class="border p-1 rounded flex-1" value={editName()} onInput={e => setEditName(e.target.value)} required />
                    <textarea class="border p-1 rounded flex-1" value={editDescription()} onInput={e => setEditDescription(e.target.value)} rows={2} />
                    <input class="border p-1 rounded flex-1" value={editPoints()} onInput={e => setEditPoints(e.target.value)} required />
                    <button class="bg-green-500 text-white px-3 py-1 rounded" type="submit">Kaydet</button>
                    <button class="bg-gray-300 text-gray-700 px-3 py-1 rounded" type="button" onClick={() => setEditId(null)}>Vazgeç</button>
                  </form>
                </Show>
              </li>
            }</For>
          </ul>
        </div>
      </Show>

      <Show when={analysisTab() === 'levels'}>
        <div class="space-y-6">
          {/* Ana Seviye Kartı */}
          <div class={`bg-gradient-to-r ${getLevelColor(calculateLevel().level)} rounded-xl p-6 text-white shadow-lg`}>
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-4">
                <div class="text-6xl">{getLevelIcon(calculateLevel().level)}</div>
                <div>
                  <h3 class="text-2xl font-bold">Seviye {calculateLevel().level}</h3>
                  <p class="text-sm opacity-90">Toplam XP: {calculateLevel().totalXP}</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm opacity-90">Sonraki seviye için:</div>
                <div class="text-lg font-bold">{calculateLevel().currentXP} / {calculateLevel().nextLevelXP} XP</div>
              </div>
            </div>
            
            {/* İlerleme Çubuğu */}
            <div class="w-full bg-black bg-opacity-20 rounded-full h-4 mb-2">
              <div 
                class="bg-white h-4 rounded-full transition-all duration-500 ease-out"
                style={`width: ${calculateLevel().progress}%`}
              ></div>
            </div>
            <div class="text-sm opacity-90 text-center">
              %{calculateLevel().progress} tamamlandı - {calculateLevel().nextLevelXP - calculateLevel().currentXP} XP kaldı
            </div>
          </div>

          {/* Seviye Aşamaları */}
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
            <h4 class="text-lg font-bold mb-4 text-gray-800">🏆 Seviye Aşamaları</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { level: 1, icon: '🌱', title: 'Başlangıç', desc: 'Yolculuğun başlangıcı' },
                { level: 5, icon: '🔥', title: 'Ateşli', desc: 'Motivasyon yüksek!' },
                { level: 10, icon: '⭐', title: 'Yıldız', desc: 'Parlayan performans' },
                { level: 15, icon: '🥉', title: 'Bronz', desc: 'İlk büyük başarı' },
                { level: 20, icon: '🥈', title: 'Gümüş', desc: 'Ustalaşıyorsun' },
                { level: 25, icon: '🥇', title: 'Altın', desc: 'Altın standart' },
                { level: 30, icon: '💎', title: 'Elmas', desc: 'Nadir başarı' },
                { level: 40, icon: '🏆', title: 'Şampiyon', desc: 'Zirveye yakın' },
                { level: 50, icon: '👑', title: 'Kral', desc: 'Mutlak hakimiyet' }
              ].map(stage => (
                <div 
                  class={`p-4 rounded-lg border-2 transition-all ${
                    calculateLevel().level >= stage.level 
                      ? 'bg-green-100 border-green-300 shadow-md' 
                      : calculateLevel().level >= stage.level - 5
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div class="text-2xl mb-2">{stage.icon}</div>
                  <div class="font-bold text-sm">{stage.title}</div>
                  <div class="text-xs text-gray-600">Seviye {stage.level}+</div>
                  <div class="text-xs text-gray-500 mt-1">{stage.desc}</div>
                  {calculateLevel().level >= stage.level && (
                    <div class="text-xs text-green-600 font-semibold mt-1">✅ Tamamlandı</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* İstatistikler */}
          <div class="bg-white rounded-lg p-6 shadow-sm border">
            <h4 class="text-lg font-bold mb-4 text-gray-800">📊 Detaylı İstatistikler</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <For each={Object.entries(analyticsTotal())}>{([attr, value]) => (
                  <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span class="font-medium text-gray-700">{attr}</span>
                    <span class="font-bold text-lg text-blue-600">{value} XP</span>
                  </div>
                )}</For>
              </div>
              <div class="space-y-3">
                <div class="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded">
                  <div class="text-sm text-gray-600">Sonraki seviye için gereken XP:</div>
                  <div class="text-2xl font-bold text-purple-600">{calculateLevel().nextLevelXP - calculateLevel().currentXP}</div>
                </div>
                <div class="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded">
                  <div class="text-sm text-gray-600">Bu seviyede ilerleme:</div>
                  <div class="text-2xl font-bold text-green-600">%{calculateLevel().progress}</div>
                </div>
                <div class="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded">
                  <div class="text-sm text-gray-600">Mevcut seviye:</div>
                  <div class="text-2xl font-bold text-orange-600">{calculateLevel().level}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={analysisTab() === 'skills'}>
        <div class="space-y-6">
          {/* Skill Seviyelerine Genel Bakış */}
          <div class="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-6 border border-emerald-200">
            <h3 class="text-2xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
              🎯 Skill Seviyeleri
              <span class="text-sm font-normal text-emerald-600">Her beceri alanında uzmanlaş!</span>
            </h3>
            <div class="text-sm text-emerald-700 mb-4">
              Her skill için ayrı seviye hesaplanır. Skill'lerde uzmanlaşmak için o alanda daha çok puan kazanın!
            </div>
          </div>

          {/* Skill Kartları */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <For each={Object.entries(analyticsTotal())}>{([skillName, totalXP]) => {
              const skillData = calculateSkillLevel(skillName)
              return (
                <div class={`bg-gradient-to-br ${getSkillColor(skillName, skillData.level)} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                  {/* Skill Başlığı */}
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="text-4xl">{getSkillIcon(skillName, skillData.level)}</div>
                      <div>
                        <h4 class="text-xl font-bold capitalize">{skillName}</h4>
                        <p class="text-sm opacity-90">Seviye {skillData.level}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm opacity-90">Toplam XP</div>
                      <div class="text-lg font-bold">{skillData.totalXP}</div>
                    </div>
                  </div>

                  {/* İlerleme Bilgisi */}
                  <div class="mb-3">
                    <div class="flex justify-between text-sm text-white mb-1">
                      <span>Sonraki seviye için:</span>
                      <span>{skillData.currentXP} / {skillData.nextLevelXP} XP</span>
                    </div>
                    
                    {/* İlerleme Çubuğu */}
                    <div class="w-full bg-black bg-opacity-20 rounded-full h-3">
                      <div 
                        class="bg-white h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={`width: ${skillData.progress}%`}
                      ></div>
                    </div>
                    
                    <div class="text-center text-sm text-white mt-2">
                      %{skillData.progress} tamamlandı • {skillData.nextLevelXP - skillData.currentXP} XP kaldı
                    </div>
                  </div>

                  {/* Skill Özel Bilgiler */}
                  <div class="bg-white bg-opacity-20 rounded-lg p-3 mt-4">
                    <div class="text-xs text-white mb-1">Bu skill'de kazanılan unvan:</div>
                    <div class="font-semibold text-sm text-white">
                      {skillData.level >= 30 ? 'Usta' : 
                       skillData.level >= 20 ? 'Uzman' : 
                       skillData.level >= 10 ? 'Deneyimli' : 
                       skillData.level >= 5 ? 'Gelişen' : 'Başlangıç'}
                    </div>
                  </div>
                </div>
              )
            }}</For>
          </div>

          {/* Skill Karşılaştırma Tablosu */}
          <div class="bg-white rounded-xl p-6 shadow-lg border">
            <h4 class="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              📈 Skill Karşılaştırması
            </h4>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-3 px-2 font-semibold text-gray-700">Skill</th>
                    <th class="text-center py-3 px-2 font-semibold text-gray-700">Seviye</th>
                    <th class="text-center py-3 px-2 font-semibold text-gray-700">Toplam XP</th>
                    <th class="text-center py-3 px-2 font-semibold text-gray-700">İlerleme</th>
                    <th class="text-center py-3 px-2 font-semibold text-gray-700">Unvan</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={Object.entries(analyticsTotal()).sort((a, b) => calculateSkillLevel(b[0]).level - calculateSkillLevel(a[0]).level)}>{([skillName, totalXP]) => {
                    const skillData = calculateSkillLevel(skillName)
                    return (
                      <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td class="py-3 px-2">
                          <div class="flex items-center gap-2">
                            <span class="text-xl">{getSkillIcon(skillName, skillData.level)}</span>
                            <span class="font-medium capitalize">{skillName}</span>
                          </div>
                        </td>
                        <td class="text-center py-3 px-2">
                          <span class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {skillData.level}
                          </span>
                        </td>
                        <td class="text-center py-3 px-2 font-semibold text-gray-700">
                          {skillData.totalXP}
                        </td>
                        <td class="text-center py-3 px-2">
                          <div class="flex items-center gap-2">
                            <div class="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                class={`bg-gradient-to-r ${getSkillColor(skillName, skillData.level).replace('from-', 'from-').replace('to-', 'to-')} h-2 rounded-full transition-all duration-500`}
                                style={`width: ${skillData.progress}%`}
                              ></div>
                            </div>
                            <span class="text-xs text-gray-600 w-10">{skillData.progress}%</span>
                          </div>
                        </td>
                        <td class="text-center py-3 px-2">
                          <span class={`px-2 py-1 rounded-full text-xs font-semibold ${
                            skillData.level >= 30 ? 'bg-yellow-100 text-yellow-800' :
                            skillData.level >= 20 ? 'bg-purple-100 text-purple-800' :
                            skillData.level >= 10 ? 'bg-blue-100 text-blue-800' :
                            skillData.level >= 5 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {skillData.level >= 30 ? 'Usta' : 
                             skillData.level >= 20 ? 'Uzman' : 
                             skillData.level >= 10 ? 'Deneyimli' : 
                             skillData.level >= 5 ? 'Gelişen' : 'Başlangıç'}
                          </span>
                        </td>
                      </tr>
                    )
                  }}</For>
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill İpuçları */}
          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h4 class="text-lg font-bold mb-3 text-indigo-800 flex items-center gap-2">
              💡 Skill Geliştirme İpuçları
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="space-y-2">
                <div class="flex items-start gap-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-gray-700">Her skill'de tutarlı olarak çalışın</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-gray-700">Zayıf skill'lerinizi güçlendirin</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-green-500">✓</span>
                  <span class="text-gray-700">Günlük küçük ilerlemeler yapın</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-start gap-2">
                  <span class="text-blue-500">🎯</span>
                  <span class="text-gray-700">Seviye 10'a ulaşmak için odaklanın</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-blue-500">🎯</span>
                  <span class="text-gray-700">Uzman seviyesine (20+) çıkmaya çalışın</span>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-blue-500">🎯</span>
                  <span class="text-gray-700">Usta seviyesi (30+) için sabır gösterin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Trendler Sekmesi */}
      <Show when={analysisTab() === 'trends'}>
        <div class="space-y-6">
          {/* Zaman Aralığı Seçici */}
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex flex-wrap gap-4 items-center">
              <label class="text-sm font-medium text-gray-700">Zaman Aralığı:</label>
              <select 
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={timeRange()}
                onChange={e => setTimeRange(e.target.value)}
              >
                <option value="7days">Son 7 Gün</option>
                <option value="30days">Son 30 Gün</option>
                <option value="3months">Son 3 Ay</option>
                <option value="1year">Son 1 Yıl</option>
              </select>
            </div>
          </div>

          {/* Son 7 Günün Trendi */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              📈 Son 7 Günün Aktivite Trendi
            </h3>
            <Show when={getAdvancedStats()} fallback={<p class="text-gray-500">Veri yok</p>}>
              <div class="grid grid-cols-7 gap-2 mb-4">
                <For each={getAdvancedStats().last7Days}>{day => (
                  <div class="text-center">
                    <div class="text-xs text-gray-600 mb-1">{day.date}</div>
                    <div class={`h-16 rounded-lg flex items-end justify-center text-xs font-semibold text-white ${
                      day.count === 0 ? 'bg-gray-200' : 
                      day.count <= 2 ? 'bg-gradient-to-t from-yellow-400 to-yellow-500' :
                      day.count <= 5 ? 'bg-gradient-to-t from-green-400 to-green-500' :
                      'bg-gradient-to-t from-blue-400 to-blue-500'
                    }`}>
                      <div class="pb-1">{day.count}</div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">{day.points}pt</div>
                  </div>
                )}</For>
              </div>
              <div class="text-sm text-gray-600 text-center">
                Günlük eylem sayısı ve toplam puanlar
              </div>
            </Show>
          </div>

          {/* Skill Dağılımı */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              🎯 Skill Dağılımı
            </h3>
            <Show when={getAdvancedStats()} fallback={<p class="text-gray-500">Veri yok</p>}>
              <div class="space-y-3">
                <For each={Object.entries(getAdvancedStats().skillDistribution).sort((a, b) => b[1].points - a[1].points)}>{([skill, data]) => (
                  <div>
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-sm font-medium capitalize">{skill}</span>
                      <span class="text-sm text-gray-600">{data.points} puan (%{data.percentage})</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        class={`bg-gradient-to-r ${getSkillColor(skill, 15).replace('from-', 'from-').replace('to-', 'to-')} h-3 rounded-full transition-all duration-500`}
                        style={`width: ${data.percentage}%`}
                      ></div>
                    </div>
                  </div>
                )}</For>
              </div>
            </Show>
          </div>

          {/* Streak İstatistikleri */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Show when={getAdvancedStats()}>
              <div class="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg p-6 text-white">
                <div class="text-3xl mb-2">🔥</div>
                <div class="text-2xl font-bold">{getAdvancedStats().currentStreak}</div>
                <div class="text-sm opacity-90">Mevcut Seri</div>
              </div>
              
              <div class="bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg p-6 text-white">
                <div class="text-3xl mb-2">🏆</div>
                <div class="text-2xl font-bold">{getAdvancedStats().maxStreak}</div>
                <div class="text-sm opacity-90">En Uzun Seri</div>
              </div>
              
              <div class="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg p-6 text-white">
                <div class="text-3xl mb-2">📅</div>
                <div class="text-2xl font-bold">{getAdvancedStats().totalDays}</div>
                <div class="text-sm opacity-90">Aktif Gün</div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Performans Sekmesi */}
      <Show when={analysisTab() === 'performance'}>
        <div class="space-y-6">
          {/* Performans Skoru */}
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
            <div class="text-center">
              <div class="text-6xl mb-4">🎯</div>
              <h2 class="text-3xl font-bold mb-2">Performans Skoru</h2>
              <div class="text-6xl font-bold mb-2">{getPerformanceScore().score}</div>
              <div class="text-2xl font-semibold mb-2">Not: {getPerformanceScore().grade}</div>
              <div class="text-lg opacity-90">{getPerformanceScore().description}</div>
            </div>
          </div>

          {/* Detaylı Performans Analizi */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Show when={getAdvancedStats()}>
              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4 text-gray-800">📊 Aktivite Analizi</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Günlük Ortalama:</span>
                    <span class="font-semibold">{getAdvancedStats().avgActionsPerDay} eylem</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Toplam Eylem:</span>
                    <span class="font-semibold">{getAdvancedStats().totalActions}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">En Aktif Gün:</span>
                    <span class="font-semibold">{getAdvancedStats().mostActiveDay}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">O Gün Eylem:</span>
                    <span class="font-semibold">{getAdvancedStats().mostActiveDayCount}</span>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-bold mb-4 text-gray-800">🎯 Skill Çeşitliliği</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Farklı Skill:</span>
                    <span class="font-semibold">{Object.keys(getAdvancedStats().skillDistribution).length}</span>
                  </div>
                  <div class="text-sm text-gray-500 mt-2">Skill Dağılımı:</div>
                  <For each={Object.entries(getAdvancedStats().skillDistribution).slice(0, 3)}>{([skill, data]) => (
                    <div class="flex justify-between text-sm">
                      <span class="capitalize">{skill}:</span>
                      <span>{data.percentage}%</span>
                    </div>
                  )}</For>
                </div>
              </div>
            </Show>
          </div>

          {/* İyileştirme Önerileri */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
              💡 İyileştirme Önerileri
            </h3>
            <Show when={getAdvancedStats()}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 class="font-semibold text-blue-800 mb-2">Tutarlılık</h4>
                  <p class="text-sm text-blue-700">
                    {getAdvancedStats().currentStreak > 7 
                      ? "Harika! Tutarlılığınızı koruyun." 
                      : "Günlük eylem yapmaya odaklanın. Küçük adımlar büyük değişimler yaratır."}
                  </p>
                </div>
                
                <div class="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 class="font-semibold text-green-800 mb-2">Çeşitlilik</h4>
                  <p class="text-sm text-green-700">
                    {Object.keys(getAdvancedStats().skillDistribution).length > 3
                      ? "Skill çeşitliliğiniz iyi! Dengeyi koruyun."
                      : "Farklı skill alanlarında da çalışmayı deneyin."}
                  </p>
                </div>
                
                <div class="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <h4 class="font-semibold text-yellow-800 mb-2">Aktivite</h4>
                  <p class="text-sm text-yellow-700">
                    {getAdvancedStats().avgActionsPerDay >= 3
                      ? "Günlük aktivite seviyeniz mükemmel!"
                      : "Günlük hedef sayısını artırmayı deneyin."}
                  </p>
                </div>
                
                <div class="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 class="font-semibold text-purple-800 mb-2">Hedefler</h4>
                  <p class="text-sm text-purple-700">
                    Prestij sistemiyle daha büyük hedefler belirleyin ve ödüller kazanın!
                  </p>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Eylem Geçmişi Sekmesi */}
      <Show when={analysisTab() === 'logs'}>
        <div class="space-y-6">
          {/* Gelişmiş Filtreler */}
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold mb-4 text-gray-800">🔍 Gelişmiş Filtreler</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dönem</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={period()} onInput={e => setPeriod(e.target.value)}>
                  <option value="all">Tümü</option>
                  <option value="today">Bugün</option>
                  <option value="week">Bu Hafta</option>
                  <option value="month">Bu Ay</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Arama</label>
                <input 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  value={search()} 
                  onInput={e => setSearch(e.target.value)} 
                  placeholder="Görev/açıklama ara..." 
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Skill Filtresi</label>
                <input 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  value={attr()} 
                  onInput={e => setAttr(e.target.value)} 
                  placeholder="Skill adı ara..." 
                />
              </div>
            </div>
          </div>

          {/* Özet İstatistikleri */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-lg shadow p-4 text-center">
              <div class="text-2xl mb-2">📝</div>
              <div class="text-2xl font-bold text-purple-600">{filteredActions().length}</div>
              <div class="text-sm text-gray-600">Toplam Eylem</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 text-center">
              <div class="text-2xl mb-2">🎯</div>
              <div class="text-2xl font-bold text-blue-600">{Object.keys(analyticsTotal()).length}</div>
              <div class="text-sm text-gray-600">Farklı Skill</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 text-center">
              <div class="text-2xl mb-2">⭐</div>
              <div class="text-2xl font-bold text-yellow-600">{Object.values(analyticsTotal()).reduce((sum, val) => sum + Math.max(0, val), 0)}</div>
              <div class="text-sm text-gray-600">Toplam Puan</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4 text-center">
              <div class="text-2xl mb-2">📊</div>
              <div class="text-2xl font-bold text-green-600">{filteredActions().length > 0 ? Math.round(Object.values(analyticsTotal()).reduce((sum, val) => sum + Math.max(0, val), 0) / filteredActions().length) : 0}</div>
              <div class="text-sm text-gray-600">Ortalama Puan</div>
            </div>
          </div>

          {/* Eylem Listesi */}
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-gray-800">📋 Eylem Geçmişi</h3>
              <div class="text-sm text-gray-600">
                Toplam {filteredActions().length} eylem
              </div>
            </div>
            
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <For each={filteredActions().slice(0, 50)}>{action => (
                <Show when={editId() === action.id} fallback={
                  <div class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">{action.name}</h4>
                        <p class="text-sm text-gray-600 mt-1">{action.description}</p>
                        <div class="flex flex-wrap gap-1 mt-2">
                          <For each={Object.entries(action.points || {})}>{([skill, points]) => (
                            <span class={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getSkillColor(skill, 10).replace('from-', 'from-').replace('to-', 'to-')} text-white`}>
                              {skill}: +{points}
                            </span>
                          )}</For>
                        </div>
                        <div class="text-xs text-gray-500 mt-2">
                          📅 {new Date(action.date).toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button 
                          class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition"
                          onClick={() => startEdit(action)}
                        >
                          ✏️
                        </button>
                        <button 
                          class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
                          onClick={() => deleteAction(action.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                }>
                  <div class="p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                    <form class="space-y-3" onSubmit={saveEdit}>
                      <input 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        value={editName()} 
                        onInput={e => setEditName(e.target.value)} 
                        placeholder="Eylem adı"
                        required 
                      />
                      <textarea 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        value={editDescription()} 
                        onInput={e => setEditDescription(e.target.value)} 
                        placeholder="Açıklama"
                        rows={2}
                      />
                      <input 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        value={editPoints()} 
                        onInput={e => setEditPoints(e.target.value)} 
                        placeholder="puanlar (örn: temizlik:10,spor:5)"
                        required 
                      />
                      <div class="flex gap-2">
                        <button 
                          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition"
                          type="submit"
                        >
                          💾 Kaydet
                        </button>
                        <button 
                          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition"
                          type="button"
                          onClick={() => setEditId(null)}
                        >
                          ❌ İptal
                        </button>
                      </div>
                    </form>
                  </div>
                </Show>
              )}</For>
            </div>
            
            {filteredActions().length > 50 && (
              <div class="text-center mt-4 text-sm text-gray-500">
                İlk 50 eylem gösteriliyor. Daha fazlası için filtreleri kullanın.
              </div>
            )}
          </div>
        </div>
      </Show>
    </div>
  )
}
