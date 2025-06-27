import { For, Show, createSignal, createMemo } from 'solid-js'

export default function TodoTab(props) {
  const { 
    // Todo özel props
    todos, setTodos, addTodo, deleteTodo, completeTodo, undoTodo,
    // Görev ekleme için paylaşılan props
    name, setName, description, setDescription, points, setPoints,
    // Envanter referansı
    inventory, setInventory,
    // Scripts referansı
    scripts
  } = props

  // Pagination state
  const [currentPage, setCurrentPage] = createSignal(1)
  const [itemsPerPage, setItemsPerPage] = createSignal(10)
  const [searchTerm, setSearchTerm] = createSignal('')
  const [sortBy, setSortBy] = createSignal('date') // date, name, points, status, priority
  const [sortOrder, setSortOrder] = createSignal('desc') // asc, desc
  const [filterBy, setFilterBy] = createSignal('pending') // pending, completed, all - başlangıç: sadece aktif görevler

  // Yeni görev özellikleri
  const [expReward, setExpReward] = createSignal('')
  const [itemReward, setItemReward] = createSignal('')
  const [priority, setPriority] = createSignal('normal') // low, normal, high, urgent
  const [dueDate, setDueDate] = createSignal('')
  const [category, setCategory] = createSignal('')
  const [selectedScripts, setSelectedScripts] = createSignal([])

  // Görev tamamlama/geri alma
  const completeTask = (taskId) => {
    const task = todos().find(t => t.id === taskId)
    if (!task || task.completed) return

    // Önce todo'yu tamamla
    completeTodo(taskId)

    // Sonra item ödüllerini ver
    if (task.itemRewards && Object.keys(task.itemRewards).length > 0) {
      const currentInventory = inventory() || []
      const earnedItems = []
      
      Object.entries(task.itemRewards).forEach(([itemName, amount]) => {
        const existingItem = currentInventory.find(item => item.name === itemName)
        
        if (existingItem) {
          existingItem.amount += amount
        } else {
          currentInventory.push({
            id: Date.now() + Math.random(), // Unique ID
            name: itemName,
            amount: amount,
            description: `${task.name} görevinden kazanıldı`,
            earnedAt: new Date().toISOString()
          })
        }
        
        earnedItems.push(`${itemName} x${amount}`)
      })
      
      setInventory([...currentInventory])
      
      // Başarı mesajı göster
      alert(`🎁 Tebrikler! ${earnedItems.join(', ')} kazandınız!`)
    }
    // Eski format desteği (geriye uyumluluk)
    else if (task.itemReward && task.itemAmount) {
      const currentInventory = inventory() || []
      const existingItem = currentInventory.find(item => item.name === task.itemReward)
      
      if (existingItem) {
        existingItem.amount += task.itemAmount
      } else {
        currentInventory.push({
          id: Date.now(),
          name: task.itemReward,
          amount: task.itemAmount,
          description: `${task.name} görevinden kazanıldı`,
          earnedAt: new Date().toISOString()
        })
      }
      
      setInventory([...currentInventory])
      alert(`🎁 Tebrikler! ${task.itemReward} x${task.itemAmount} kazandınız!`)
    }
  }

  const undoTask = (taskId) => {
    const task = todos().find(t => t.id === taskId)
    if (!task || !task.completed) return

    // Önce todo'yu geri al
    undoTodo(taskId)

    // Sonra item ödüllerini geri al
    if (task.itemRewards && Object.keys(task.itemRewards).length > 0) {
      const currentInventory = inventory() || []
      const removedItems = []
      
      Object.entries(task.itemRewards).forEach(([itemName, amount]) => {
        const existingItem = currentInventory.find(item => item.name === itemName)
        
        if (existingItem) {
          existingItem.amount = Math.max(0, existingItem.amount - amount)
          if (existingItem.amount === 0) {
            const index = currentInventory.indexOf(existingItem)
            currentInventory.splice(index, 1)
          }
        }
        
        removedItems.push(`${itemName} x${amount}`)
      })
      
      setInventory([...currentInventory])
      alert(`↩️ ${removedItems.join(', ')} geri alındı!`)
    }
    // Eski format desteği (geriye uyumluluk)
    else if (task.itemReward && task.itemAmount) {
      const currentInventory = inventory() || []
      const existingItem = currentInventory.find(item => item.name === task.itemReward)
      
      if (existingItem) {
        existingItem.amount = Math.max(0, existingItem.amount - task.itemAmount)
        if (existingItem.amount === 0) {
          const index = currentInventory.indexOf(existingItem)
          currentInventory.splice(index, 1)
        }
      }
      
      setInventory([...currentInventory])
      alert(`↩️ ${task.itemReward} x${task.itemAmount} geri alındı!`)
    }
  }

  // Filtreleme ve sıralama
  const filteredAndSortedTodos = createMemo(() => {
    let filtered = todos() || []
    
    // Durum filtresi
    if (filterBy() === 'pending') {
      filtered = filtered.filter(todo => !todo.completed)
    } else if (filterBy() === 'completed') {
      filtered = filtered.filter(todo => todo.completed)
    }
    
    // Arama filtresi
    if (searchTerm()) {
      const term = searchTerm().toLowerCase()
      filtered = filtered.filter(todo => 
        todo.name.toLowerCase().includes(term) ||
        todo.description.toLowerCase().includes(term) ||
        (todo.category && todo.category.toLowerCase().includes(term))
      )
    }

    // Sıralama
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy()) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.date) - new Date(b.date)
          break
        case 'points':
          const aTotal = Object.values(a.points || {}).reduce((sum, val) => sum + val, 0)
          const bTotal = Object.values(b.points || {}).reduce((sum, val) => sum + val, 0)
          comparison = aTotal - bTotal
          break
        case 'status':
          const aStatus = a.completed ? 1 : 0
          const bStatus = b.completed ? 1 : 0
          comparison = aStatus - bStatus
          break
        case 'priority':
          const priorityOrder = { low: 1, normal: 2, high: 3, urgent: 4 }
          comparison = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
          break
      }
      
      return sortOrder() === 'asc' ? comparison : -comparison
    })

    return filtered
  })

  // Pagination hesaplama
  const paginatedTodos = createMemo(() => {
    const start = (currentPage() - 1) * itemsPerPage()
    const end = start + itemsPerPage()
    return filteredAndSortedTodos().slice(start, end)
  })

  const totalPages = createMemo(() => 
    Math.ceil(filteredAndSortedTodos().length / itemsPerPage())
  )

  // Sayfa değiştirme
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page)
    }
  }

  // Yardımcı fonksiyonlar
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'normal': return 'bg-blue-500 text-white'
      case 'low': return 'bg-gray-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🚨'
      case 'high': return '⚡'
      case 'normal': return '📋'
      case 'low': return '📝'
      default: return '📋'
    }
  }

  const getCategoryIcon = (category) => {
    if (!category) return '📋'
    const cat = category.toLowerCase()
    if (cat.includes('temizlik')) return '🧹'
    if (cat.includes('egzersiz') || cat.includes('spor')) return '🏃'
    if (cat.includes('öğren') || cat.includes('ders')) return '📚'
    if (cat.includes('iş') || cat.includes('work')) return '💼'
    if (cat.includes('alışveriş')) return '🛒'
    if (cat.includes('sağlık')) return '🏥'
    return '📋'
  }

  const getStatusBadge = (task) => {
    if (task.completed) {
      return <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✅ Tamamlandı
      </span>
    }
    
    if (task.dueDate) {
      const due = new Date(task.dueDate)
      const now = new Date()
      const diffTime = due - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⏰ Gecikti
        </span>
      } else if (diffDays === 0) {
        return <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          📅 Bugün
        </span>
      } else if (diffDays <= 3) {
        return <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          ⚠️ Yakında
        </span>
      }
    }
    
    return <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      ⏳ Bekliyor
    </span>
  }

  // İstatistikler
  const taskStats = createMemo(() => {
    const allTasks = todos() || []
    const completed = allTasks.filter(t => t.completed).length
    const pending = allTasks.filter(t => !t.completed).length
    const overdue = allTasks.filter(t => {
      if (t.completed || !t.dueDate) return false
      const due = new Date(t.dueDate)
      const now = new Date()
      return due < now
    }).length
    
    return { total: allTasks.length, completed, pending, overdue }
  })

  // Tarih formatla
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Bugün'
    if (diffDays === 2) return 'Dün'
    if (diffDays <= 7) return `${diffDays} gün önce`
    return date.toLocaleDateString('tr-TR')
  }

  // Script seçme/kaldırma
  const toggleScript = (scriptId) => {
    setSelectedScripts(current => {
      if (current.includes(scriptId)) {
        return current.filter(id => id !== scriptId)
      } else {
        return [...current, scriptId]
      }
    })
  }

  // Gelişmiş görev ekleme
  const addAdvancedTask = (e) => {
    e.preventDefault()
    
    if (!name().trim()) return
    
    // Item rewards parsing
    let itemRewards = {}
    if (itemReward() && itemReward().trim()) {
      try {
        const pairs = itemReward().split(',').map(p => p.trim()).filter(Boolean)
        for (const pair of pairs) {
          if (!pair.includes(':')) {
            throw new Error(`Geçersiz item formatı: "${pair}". Doğru format: "item:miktar"`)
          }
          const [itemName, amount] = pair.split(':')
          const trimmedName = itemName.trim()
          const trimmedAmount = amount.trim()
          
          if (!trimmedName) {
            throw new Error('Item adı boş olamaz!')
          }
          
          const numAmount = parseInt(trimmedAmount)
          if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error(`Geçersiz miktar: "${trimmedAmount}". Pozitif sayı olmalıdır.`)
          }
          
          itemRewards[trimmedName] = numAmount
        }
      } catch (err) {
        alert(`❌ Item ödülü formatı hatalı: ${err.message}\n\nÖrnek: altın:5,gümüş:3,elmas:1`)
        return
      }
    }

    // Todo objesi oluştur
    const todo = { 
      id: Date.now(), 
      name: name().trim(), 
      description: description().trim(), 
      points: {},
      date: new Date().toISOString(),
      completed: false,
      status: 'pending',
      priority: priority() || 'normal',
      category: category() || '',
      dueDate: dueDate() || '',
      itemRewards: itemRewards, // Çoklu item desteği
      expReward: parseInt(expReward()) || 0,
      selectedScripts: selectedScripts(), // Seçili scriptler
      createdAt: new Date().toISOString()
    }

    // Points değerini güvenli şekilde parse et
    if (points() && points().trim()) {
      try {
        todo.points = validatePoints(points())
      } catch (err) {
        const numValue = parseInt(points())
        if (!isNaN(numValue)) {
          todo.points = { exp: numValue }
        } else {
          alert(`❌ Puan formatı hatalı: ${err.message}`)
          return
        }
      }
    }

    // Todo'yu ekle
    setTodos(t => { 
      const nt = [...t, todo]
      localStorage.setItem('todos', JSON.stringify(nt))
      return nt 
    })
    
    // Formları temizle
    setName('')
    setDescription('')
    setPoints('')
    setExpReward('')
    setItemReward('')
    setPriority('normal')
    setDueDate('')
    setCategory('')
    setSelectedScripts([])
  }

  // Points validasyon fonksiyonu
  const validatePoints = (pointsString) => {
    if (!pointsString || pointsString.trim() === '') {
      throw new Error('Puan alanı boş olamaz!')
    }
    
    const pairs = pointsString.split(',').map(p => p.trim()).filter(Boolean)
    
    if (pairs.length === 0) {
      throw new Error('En az bir puan çifti girilmelidir!')
    }
    
    const validatedPoints = {}
    
    for (const pair of pairs) {
      if (!pair.includes(':')) {
        throw new Error(`Geçersiz format: "${pair}". Doğru format: "skill:sayı"`)
      }
      
      const [key, value] = pair.split(':')
      const trimmedKey = key.trim()
      const trimmedValue = value.trim()
      
      // Key kontrolü
      if (!trimmedKey || trimmedKey === '') {
        throw new Error('Skill adı boş olamaz!')
      }
      
      // Skill adında sadece harf, rakam, türkçe karakter ve alt çizgi olmalı
      if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_\s]+$/.test(trimmedKey)) {
        throw new Error(`Geçersiz skill adı: "${trimmedKey}". Sadece harf, rakam ve alt çizgi kullanabilirsiniz.`)
      }
      
      // Value kontrolü  
      if (!trimmedValue || trimmedValue === '') {
        throw new Error('Puan değeri boş olamaz!')
      }
      
      const numValue = parseInt(trimmedValue)
      if (isNaN(numValue)) {
        throw new Error(`Geçersiz puan değeri: "${trimmedValue}". Sayı olmalıdır.`)
      }
      
      validatedPoints[trimmedKey] = numValue
    }
    
    return validatedPoints
  }

  return (
    <div class="space-y-4 sm:space-y-6 container-safe">      
      {/* Responsive Başlık */}
      <div class="text-center px-2">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
          ✅ <span class="hidden sm:inline">Todo List</span><span class="sm:hidden">Görevler</span>
        </h1>
        <p class="text-sm sm:text-base text-gray-600 responsive-text">
          Görevlerini takip et, tamamla ve ödüllerini kazan!
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-blue-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">📋</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Toplam</div>
              <div class="text-lg md:text-xl font-bold text-blue-600 truncate">{taskStats().total}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-green-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">✅</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Tamamlanan</div>
              <div class="text-lg md:text-xl font-bold text-green-600 truncate">{taskStats().completed}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-yellow-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">⏳</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Bekleyen</div>
              <div class="text-lg md:text-xl font-bold text-yellow-600 truncate">{taskStats().pending}</div>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg p-3 md:p-4 shadow-md border-l-4 border-red-500">
          <div class="flex items-center gap-2 md:gap-3">
            <div class="text-xl md:text-2xl">⚠️</div>
            <div class="min-w-0 flex-1">
              <div class="text-xs md:text-sm text-gray-600 truncate">Geciken</div>
              <div class="text-lg md:text-xl font-bold text-red-600 truncate">{taskStats().overdue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Görev Ekleme Formu */}
      <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 md:p-6 border border-purple-200 shadow-lg">
        <h2 class="text-lg md:text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
          ✨ Yeni Görev Ekle
        </h2>
        <form class="space-y-4" onSubmit={addAdvancedTask}>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Görev Adı *</label>
              <input 
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={name()} 
                onInput={e => setName(e.target.value)} 
                placeholder="🎯 Görev adını girin" 
                required 
              />
            </div>
            
            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Açıklama</label>
              <input 
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={description()} 
                onInput={e => setDescription(e.target.value)} 
                placeholder="📝 Detayları belirtin" 
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Kategori</label>
              <input 
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={category()} 
                onInput={e => setCategory(e.target.value)} 
                placeholder="📂 Örn: Temizlik, İş" 
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Öncelik</label>
              <select 
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm md:text-base" 
                value={priority()} 
                onInput={e => setPriority(e.target.value)}
              >
                <option value="low">📝 Düşük</option>
                <option value="normal">📋 Normal</option>
                <option value="high">⚡ Yüksek</option>
                <option value="urgent">🚨 Acil</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Bitiş Tarihi</label>
              <input 
                type="date"
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={dueDate()} 
                onInput={e => setDueDate(e.target.value)} 
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Puanlar</label>
              <input 
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={points()} 
                onInput={e => setPoints(e.target.value)} 
                placeholder='💰 {"temizlik":50,"egzersiz":30}' 
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Ödül Eşya</label>
              <input 
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={itemReward()} 
                onInput={e => setItemReward(e.target.value)} 
                placeholder="🎁 Item ödülleri (altın:5,gümüş:3)" 
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs md:text-sm font-medium text-gray-700">Exp Ödülü</label>
              <input 
                type="number"
                min="0"
                class="w-full border-2 border-purple-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base" 
                value={expReward()} 
                onInput={e => setExpReward(e.target.value)} 
                placeholder="⭐ Exp puanı" 
              />
            </div>
          </div>

          {/* Script Seçim Alanı */}
          <Show when={scripts() && scripts().length > 0}>
            <div class="space-y-2">
              <label class="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-2">
                🚀 Çalışacak Scriptler
                <span class="text-xs text-gray-500">(Görev tamamlandığında)</span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                <For each={scripts() || []}>{script => (
                  <label class="flex items-center gap-2 p-2 rounded border border-gray-200 hover:border-purple-300 hover:bg-white cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={selectedScripts().includes(script.id)}
                      onChange={() => toggleScript(script.id)}
                      class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-900 truncate">{script.name}</div>
                      {script.description && (
                        <div class="text-xs text-gray-600 truncate">{script.description}</div>
                      )}
                    </div>
                  </label>
                )}</For>
                
                <Show when={!scripts()?.length}>
                  <div class="col-span-full text-center py-4 text-gray-500 text-sm">
                    <div class="text-2xl mb-1">📜</div>
                    <p>Henüz script yok</p>
                    <p class="text-xs">Scriptler sekmesinden oluşturun</p>
                  </div>
                </Show>
              </div>
              
              <Show when={selectedScripts().length > 0}>
                <div class="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                  ✅ {selectedScripts().length} script seçildi - Görev tamamlandığında çalışacak
                </div>
              </Show>
            </div>
          </Show>
          
          <button 
            class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-3 font-bold text-lg hover:from-purple-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl" 
            type="submit"
          >
            🎯 Görev Ekle
          </button>
        </form>
      </div>

      {/* Kontroller */}
      <div class="bg-white rounded-lg p-3 md:p-4 shadow-md">
        <div class="flex flex-col lg:flex-row gap-3 md:gap-4 items-stretch lg:items-center">
          <div class="flex flex-col sm:flex-row gap-2 md:gap-3 flex-1 min-w-0">
            <input 
              class="flex-1 border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm md:text-base min-w-0" 
              value={searchTerm()} 
              onInput={e => setSearchTerm(e.target.value)} 
              placeholder="🔍 Görev ara..." 
            />
            
            <select 
              class="border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm md:text-base"
              value={filterBy()} 
              onInput={e => setFilterBy(e.target.value)}
            >
              <option value="all">📋 Tüm Görevler</option>
              <option value="pending">⏳ Bekleyen</option>
              <option value="completed">✅ Tamamlanan</option>
            </select>
          </div>
          
          <div class="flex gap-2 items-center justify-between sm:justify-start">
            <select 
              class="flex-1 sm:flex-none border-2 border-gray-200 p-2 md:p-3 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm md:text-base min-w-0"
              value={sortBy()} 
              onInput={e => setSortBy(e.target.value)}
            >
              <option value="date">📅 Tarihe göre</option>
              <option value="name">📝 İsme göre</option>
              <option value="priority">⚡ Önceliğe göre</option>
              <option value="status">✅ Duruma göre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Görevler Listesi */}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            📋 Görevler
            <span class="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {filteredAndSortedTodos().length} görev
            </span>
          </h2>
        </div>

        <Show when={paginatedTodos().length === 0} fallback={
          <div class="divide-y divide-gray-200">
            <For each={paginatedTodos()}>{task =>
              <div class={`group p-4 hover:bg-blue-50 transition-all duration-200 border-l-4 ${
                task.completed ? 'border-green-400 bg-green-50' : 
                task.priority === 'urgent' ? 'border-red-500' :
                task.priority === 'high' ? 'border-orange-500' :
                task.priority === 'low' ? 'border-gray-400' : 'border-blue-500'
              }`}>
                <div class="flex items-start gap-4">
                  {/* Checkbox */}
                  <button 
                    onClick={() => task.completed ? undoTask(task.id) : completeTask(task.id)}
                    class={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all font-bold ${
                      task.completed 
                        ? 'bg-green-500 border-green-500 text-white shadow-md' 
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {task.completed && '✓'}
                  </button>

                  {/* Ana içerik alanı */}
                  <div class="flex-1 min-w-0">
                    {/* Üst kısım: Başlık ve kategori */}
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1 min-w-0 text-left">
                        <h3 class={`text-lg font-semibold leading-tight text-left ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.name}
                        </h3>
                        {task.description && (
                          <p class="text-sm text-gray-600 mt-1 leading-relaxed text-left">{task.description}</p>
                        )}
                      </div>
                      
                      {/* Kategori ikonu */}
                      {task.category && (
                        <div class="ml-3 flex flex-col items-center">
                          <div class="text-2xl mb-1" title={task.category}>
                            {getCategoryIcon(task.category)}
                          </div>
                          <span class="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            {task.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Alt kısım: Badge'ler ve bilgiler */}
                    <div class="flex items-center gap-2 flex-wrap">
                      {/* Durum badge */}
                      <div class="flex items-center gap-2">
                        {getStatusBadge(task)}
                        
                        {/* Öncelik badge */}
                        <span class={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-300' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                          task.priority === 'low' ? 'bg-gray-100 text-gray-600 border-gray-300' : 
                          'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {task.priority === 'urgent' ? '🚨 ACİL' : 
                           task.priority === 'high' ? '⚡ YÜKSEK' :
                           task.priority === 'low' ? '📝 DÜŞÜK' : '📋 NORMAL'}
                        </span>
                      </div>

                      {/* Item ödülleri */}
                      {task.itemRewards && Object.keys(task.itemRewards).length > 0 && (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                          🎁 {Object.entries(task.itemRewards).map(([name, amount]) => `${name} x${amount}`).join(', ')}
                        </span>
                      )}
                      
                      {/* Eski format desteği */}
                      {!task.itemRewards && task.itemReward && (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                          🎁 {task.itemReward} x{task.itemAmount}
                        </span>
                      )}

                      {/* Exp ödülü */}
                      {task.expReward > 0 && (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                          ⭐ +{task.expReward} EXP
                        </span>
                      )}

                      {/* Bitiş tarihi */}
                      {task.dueDate && (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300">
                          📅 {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                      )}

                      {/* Seçili scriptler */}
                      {task.selectedScripts && task.selectedScripts.length > 0 && (
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300" 
                              title={`${task.selectedScripts.length} script çalışacak`}>
                          🚀 {task.selectedScripts.length} Script
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Silme butonu */}
                  <button 
                    onClick={() => deleteTodo(task.id)}
                    class="mt-1 p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Görevi Sil"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </div>
            }</For>
          </div>
        }>
          <div class="p-8 text-center text-gray-500">
            <div class="text-4xl mb-4">📝</div>
            <p class="text-lg">Görev bulunamadı</p>
            <p class="text-sm">
              {searchTerm() || filterBy() !== 'pending' 
                ? 'Arama kriterlerinize uygun görev bulunamadı' 
                : 'Yeni görev ekleyerek başlayın!'}
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
                      ? 'bg-purple-500 text-white shadow-md' 
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
              ({filteredAndSortedTodos().length} görev)
            </span>
          </div>
        </div>
      </Show>
    </div>
  )
}
