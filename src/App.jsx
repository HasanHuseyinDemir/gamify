import { createSignal, For, Show, onMount } from 'solid-js'
import './App.css'
import LogTab from './components/tabs/LogTab'
import TodoTab from './components/tabs/TodoTab'
import AnalysisTab from './components/tabs/AnalysisTab'
import InventoryTab from './components/tabs/InventoryTab'
import RewardsTab from './components/tabs/RewardsTab'
import AchievementsTab from './components/tabs/AchievementsTab'
import RecurrentTab from './components/tabs/RecurrentTab'
import SettingsTab from './components/tabs/SettingsTab'
import ScriptsTab from './components/tabs/ScriptsTab'

function App() {
  // LocalStorage yardımcıları
  const load = (key, def) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
  }
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))

  // Görevler
  const [tasks, setTasks] = createSignal(load('tasks', []))
  const [name, setName] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [points, setPoints] = createSignal('')

  // Eylemler (loglar)
  const [actions, setActions] = createSignal(load('actions', []))
  const [editId, setEditId] = createSignal(null)
  const [editName, setEditName] = createSignal('')
  const [editDescription, setEditDescription] = createSignal('')
  const [editPoints, setEditPoints] = createSignal('')

  // Analiz
  const [period, setPeriod] = createSignal('all')
  const [search, setSearch] = createSignal('')
  const [attr, setAttr] = createSignal('')

  // Envanter
  const [inventory, setInventory] = createSignal(load('inventory', []))
  const [invSearch, setInvSearch] = createSignal('')

  // Ödüller
  const [rewards, setRewards] = createSignal(load('rewards', []))
  const [rewardName, setRewardName] = createSignal('')
  const [rewardDesc, setRewardDesc] = createSignal('')
  const [rewardCriteria, setRewardCriteria] = createSignal('')
  const [rewardMsg, setRewardMsg] = createSignal("")

  // Başarılar (Achievements)
  const [achievements, setAchievements] = createSignal(load('achievements', []))
  const [achievementName, setAchievementName] = createSignal('')
  const [achievementDesc, setAchievementDesc] = createSignal('')
  const [achievementCriteria, setAchievementCriteria] = createSignal('')
  const [achievementSearch, setAchievementSearch] = createSignal('')
  const [achievementAttr, setAchievementAttr] = createSignal('')
  const [editAchievementId, setEditAchievementId] = createSignal(null)
  const [editAchievementName, setEditAchievementName] = createSignal('')
  const [editAchievementDesc, setEditAchievementDesc] = createSignal('')
  const [editAchievementCriteria, setEditAchievementCriteria] = createSignal('')

  // Başarılar için prestij puanı state'i
  const [achievementPrestige, setAchievementPrestige] = createSignal('')
  const [editAchievementPrestige, setEditAchievementPrestige] = createSignal('')

  // Sekme
  const [tab, setTab] = createSignal('todos')

  // Todo List (yapılacaklar) - Log'dan farklı
  const [todos, setTodos] = createSignal(load('todos', []))

  // Tekrarlı eylemler için state
  const [recurrents, setRecurrents] = createSignal(load('recurrents', []));
  const [recName, setRecName] = createSignal("");
  const [recDesc, setRecDesc] = createSignal("");
  const [recPoints, setRecPoints] = createSignal("");
  const [recSearch, setRecSearch] = createSignal("");

  // Prestij sistemi
  const [prestigePoints, setPrestigePoints] = createSignal(load('prestigePoints', 0))
  const [prestigeSettings, setPrestigeSettings] = createSignal(load('prestigeSettings', { enabled: true, pointsPerAchievement: 10 }))

  // Scriptler
  const [scripts, setScripts] = createSignal(load('scripts', []))

  // Event sistemi
  const [eventHistory, setEventHistory] = createSignal(load('eventHistory', []))

  // Global Event Trigger Sistemi
  const triggerEvent = (eventName, data = {}) => {
    console.log(`[Event] ${eventName} tetiklendi:`, data)
    
    // Event history'ye ekle
    const eventRecord = {
      id: Date.now(),
      name: eventName,
      data: data,
      timestamp: new Date().toISOString()
    }
    
    const newHistory = [...eventHistory(), eventRecord].slice(-100) // Son 100 event'i tut
    setEventHistory(newHistory)
    save('eventHistory', newHistory)
    
    // Tüm scriptleri kontrol et ve ilgili olanları çalıştır
    const currentScripts = scripts() || []
    currentScripts.forEach(script => {
      try {
        // Script'in event'e tepki verip vermeyeceğini kontrol et
        if (shouldScriptRunForEvent(script, eventName, data)) {
          console.log(`[Event] Script çalıştırılıyor: ${script.name} for ${eventName}`)
          executeScript(script, { event: eventName, eventData: data, ...data })
        }
      } catch (error) {
        console.error(`[Event] Script hatası: ${script.name}`, error)
      }
    })
  }

  // Script'in belirli bir event için çalışıp çalışmayacağını belirle
  const shouldScriptRunForEvent = (script, eventName, data) => {
    // Script kodunda event name'i geçiyorsa çalıştır
    if (script.code.includes(eventName)) return true
    
    // Script kodunda eventData kullanılıyorsa çalıştır  
    if (script.code.includes('eventData') || script.code.includes('context.event')) return true
    
    // Özel durumlar
    switch (eventName) {
      case 'onTaskComplete':
        return script.code.includes('task.completed') || script.code.includes('onTaskComplete')
      case 'onTaskAdd':
        return script.code.includes('onTaskAdd') || script.code.includes('task.name')
      case 'onTaskRemove':
        return script.code.includes('onTaskRemove')
      case 'onInventoryAdd':
        return script.code.includes('onInventoryAdd') || script.code.includes('inventory') || script.code.includes('item')
      case 'onInventoryRemove':
        return script.code.includes('onInventoryRemove') || script.code.includes('inventory')
      case 'onAchievementUnlock':
        return script.code.includes('onAchievementUnlock') || script.code.includes('achievement')
      case 'onRewardUse':
        return script.code.includes('onRewardUse') || script.code.includes('reward')
      case 'onPrestigeChange':
        return script.code.includes('onPrestigeChange') || script.code.includes('prestige')
      case 'onLogAdd':
        return script.code.includes('onLogAdd') || script.code.includes('log')
      default:
        return false
    }
  }

  // LocalStorage senkronizasyonu
  const sync = () => {
    save('tasks', tasks())
    save('actions', actions())
    save('inventory', inventory())
    save('rewards', rewards())
    save('achievements', achievements())
    save('recurrents', recurrents())
    save('prestigePoints', prestigePoints())
    save('prestigeSettings', prestigeSettings())
    save('scripts', scripts())
    save('eventHistory', eventHistory())
  }
  onMount(sync)

  // Game API - Scriptler için
  const gameAPI = {
    // Görev Yönetimi
    tasks: {
      getTaskById: (id) => {
        return [...tasks(), ...todos()].find(t => t.id === id)
      },
      getAllTasks: () => {
        return [...tasks(), ...todos()]
      },
      getTodos: () => todos(),
      getLogs: () => actions(),
      addTask: (taskData) => {
        const task = {
          id: Date.now(),
          name: taskData.name,
          description: taskData.description || '',
          points: taskData.points || {},
          date: new Date().toISOString(),
          completed: false,
          status: 'pending',
          priority: taskData.priority || 'normal',
          category: taskData.category || '',
          dueDate: taskData.dueDate || '',
          itemRewards: taskData.itemRewards || {},
          expReward: taskData.expReward || 0,
          selectedScripts: taskData.selectedScripts || [],
          createdAt: new Date().toISOString()
        }
        setTodos(t => { const nt = [...t, task]; save('todos', nt); return nt })
        triggerEvent('onTaskAdd', { task })
        return task
      },
      removeTask: (id) => {
        const task = todos().find(t => t.id === id)
        if (task) {
          setTodos(t => { const nt = t.filter(x => x.id !== id); save('todos', nt); return nt })
          triggerEvent('onTaskRemove', { task })
          return true
        }
        return false
      },
      completeTask: (id) => {
        const task = todos().find(t => t.id === id && !t.completed)
        if (task) {
          completeTodo(id)
          return true
        }
        return false
      }
    },
    
    // Envanter Yönetimi
    inventory: {
      addItem: (name, amount = 1) => {
        console.log(`[inventory.addItem] Ekleniyor: ${name} x${amount}`)
        const currentInventory = inventory() || []
        const existingItem = currentInventory.find(item => item.name === name)
        
        if (existingItem) {
          const oldAmount = existingItem.amount
          existingItem.amount += amount
          console.log(`[inventory.addItem] Var olan item güncellendi: ${name}, yeni miktar: ${existingItem.amount}`)
        } else {
          currentInventory.push({
            id: Date.now(),
            name: name,
            amount: amount,
            description: `Script tarafından eklendi`,
            earnedAt: new Date().toISOString()
          })
          console.log(`[inventory.addItem] Yeni item eklendi: ${name} x${amount}`)
        }
        
        setInventory([...currentInventory])
        save('inventory', currentInventory)
        console.log(`[inventory.addItem] Envanter güncellendi`, currentInventory)
        
        // Event tetikle
        triggerEvent('onInventoryAdd', { itemName: name, amount, totalAmount: (existingItem?.amount || 0) + amount })
        return true
      },
      removeItem: (name, amount = 1) => {
        const currentInventory = inventory() || []
        const existingItem = currentInventory.find(item => item.name === name)
        
        if (existingItem && existingItem.amount >= amount) {
          const oldAmount = existingItem.amount
          existingItem.amount -= amount
          if (existingItem.amount <= 0) {
            const filtered = currentInventory.filter(item => item.name !== name)
            setInventory(filtered)
            save('inventory', filtered)
          } else {
            setInventory([...currentInventory])
            save('inventory', currentInventory)
          }
          
          // Event tetikle
          triggerEvent('onInventoryRemove', { itemName: name, amount, remainingAmount: existingItem.amount })
          return true
        }
        return false
      },
      getItem: (name) => {
        return inventory().find(item => item.name === name)
      },
      getAllItems: () => inventory(),
      getTotal: (name) => {
        const item = inventory().find(item => item.name === name)
        return item ? item.amount : 0
      }
    },

    // Başarı Sistemi
    achievements: {
      unlock: (name, description = '') => {
        const currentAchievements = achievements() || []
        const existing = currentAchievements.find(a => a.name === name)
        
        if (!existing) {
          const newAchievement = {
            id: Date.now(),
            name: name,
            description: description || `Script tarafından açıldı`,
            criteria: '',
            earned: true,
            earnedAt: new Date().toISOString(),
            prestigePoints: prestigeSettings().pointsPerAchievement
          }
          
          const updated = [...currentAchievements, newAchievement]
          setAchievements(updated)
          save('achievements', updated)
          
          // Prestij puanı ekle
          if (prestigeSettings().enabled) {
            const newPrestige = prestigePoints() + newAchievement.prestigePoints
            setPrestigePoints(newPrestige)
            save('prestigePoints', newPrestige)
          }
          
          // Event tetikle
          triggerEvent('onAchievementUnlock', { achievement: newAchievement })
          return true
        }
        return false
      },
      getAchievement: (name) => {
        return achievements().find(a => a.name === name)
      },
      getAllAchievements: () => achievements(),
      isUnlocked: (name) => {
        return achievements().some(a => a.name === name && a.earned)
      }
    },

    // Ödül Sistemi
    rewards: {
      getAllRewards: () => rewards(),
      getReward: (id) => rewards().find(r => r.id === id),
      useReward: (id, context = {}) => {
        const reward = rewards().find(r => r.id === id)
        if (reward) {
          // Event tetikle
          triggerEvent('onRewardUse', { reward, context })
          return true
        }
        return false
      },
      addReward: (rewardData) => {
        const reward = {
          id: Date.now(),
          name: rewardData.name,
          description: rewardData.description || '',
          criteria: rewardData.criteria || '',
          createdAt: new Date().toISOString(),
          ...rewardData
        }
        setRewards(r => { const nr = [...r, reward]; save('rewards', nr); return nr })
        triggerEvent('onRewardAdd', { reward })
        return reward
      }
    },

    // Log Sistemi  
    logs: {
      getAllLogs: () => actions(),
      addLog: (logData) => {
        const log = {
          id: Date.now(),
          name: logData.name,
          description: logData.description || '',
          points: logData.points || {},
          date: new Date().toISOString(),
          ...logData
        }
        setActions(a => { const na = [...a, log]; save('actions', na); return na })
        triggerEvent('onLogAdd', { log })
        return log
      },
      getLogById: (id) => actions().find(l => l.id === id)
    },

    // Prestij Sistemi
    prestige: {
      getPoints: () => prestigePoints(),
      getSettings: () => prestigeSettings(),
      addPoints: (points) => {
        const newTotal = prestigePoints() + points
        setPrestigePoints(newTotal)
        save('prestigePoints', newTotal)
        triggerEvent('onPrestigeChange', { oldPoints: prestigePoints(), newPoints: newTotal, added: points })
        return newTotal
      },
      getLevel: () => {
        const points = prestigePoints()
        if (points < 50) return { level: 1, name: 'Acemi', color: 'text-gray-600', icon: '🌱' }
        if (points < 150) return { level: 2, name: 'Deneyimli', color: 'text-green-600', icon: '🌿' }
        if (points < 300) return { level: 3, name: 'Usta', color: 'text-blue-600', icon: '⭐' }
        if (points < 500) return { level: 4, name: 'Uzman', color: 'text-purple-600', icon: '💎' }
        if (points < 750) return { level: 5, name: 'Efsane', color: 'text-orange-600', icon: '👑' }
        return { level: 6, name: 'Tanrısal', color: 'text-red-600', icon: '🔥' }
      }
    },

    // Kullanıcı Arayüzü
    ui: {
      notify: (message, type = 'info') => {
        alert(`🎮 ${message}`)
        console.log(`[Game Script Notification]: ${message}`)
        triggerEvent('onNotification', { message, type })
      },
      log: (message) => {
        console.log(`[Game Script]: ${message}`)
      },
      toast: (message, type = 'success') => {
        // Gelecekte toast sistemi için
        console.log(`[Toast ${type}]: ${message}`)
      }
    },

    // Yardımcı Fonksiyonlar
    utils: {
      getCurrentDate: () => new Date(),
      formatDate: (date) => new Date(date).toLocaleDateString('tr-TR'),
      getDaysAgo: (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      getRandomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      getRandomChoice: (array) => array[Math.floor(Math.random() * array.length)],
      calculateStreak: (tasks, days = 7) => {
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        return tasks.filter(t => t.completed && new Date(t.completedAt) > cutoffDate).length
      }
    },

    // Script Yönetimi
    scripts: {
      getAllScripts: () => scripts(),
      getScript: (id) => scripts().find(s => s.id === id),
      executeScript: (scriptId, context = {}) => {
        const script = scripts().find(s => s.id === scriptId)
        if (script) {
          return executeScript(script, context)
        }
        return null
      }
    },

    // Event Sistemi
    events: {
      trigger: (eventName, data = {}) => {
        triggerEvent(eventName, data)
      },
      getEventHistory: () => {
        return JSON.parse(localStorage.getItem('eventHistory') || '[]')
      }
    }
  }

  // Script çalıştırma fonksiyonu
  const executeScript = (script, context = {}) => {
    try {
      console.log(`[executeScript] Çalıştırılıyor: ${script.name}`, { script, context })
      const func = new Function('x', 'task', 'context', script.code)
      const result = func(gameAPI, context.task, context)
      console.log(`[executeScript] Başarılı: ${script.name}`, result)
      return result
    } catch (error) {
      console.error(`[executeScript] Hata: ${script.name}`, error)
      throw error
    }
  }

  // Görev ekle ve otomatik logla
  const addTask = (e) => {
    e.preventDefault()
    
    try {
      // Validasyon
      const pointsObj = validatePoints(points())
      
      const task = { id: Date.now(), name: name(), description: description(), points: pointsObj, date: new Date().toISOString() }
      setTasks(t => { const nt = [...t, task]; save('tasks', nt); return nt })
      setActions(a => { const na = [...a, { ...task, id: Date.now() }]; save('actions', na); return na })
      setName(''); setDescription(''); setPoints('')
      
      // Başarıları kontrol et
      setTimeout(() => checkAndUpdateAchievements(), 100);
      
    } catch (error) {
      alert(`❌ Hata: ${error.message}\n\nÖrnek doğru format:\ntemizlik:10, egzersiz:15, ogrenme:-5`)
    }
  }

  // Log sil
  const deleteAction = (id) => {
    setActions(a => { const na = a.filter(x => x.id !== id); save('actions', na); return na })
  }

  // Log düzenleme başlat
  const startEdit = (action) => {
    setEditId(action.id)
    setEditName(action.name)
    setEditDescription(action.description)
    setEditPoints(Object.entries(action.points).map(([k,v]) => `${k}:${v}`).join(', '))
  }

  // Log düzenlemeyi kaydet
  const saveEdit = (e) => {
    e.preventDefault()
    
    try {
      // Validasyon
      const pointsObj = validatePoints(editPoints())
      
      setActions(a => { const na = a.map(x => x.id === editId() ? { ...x, name: editName(), description: editDescription(), points: pointsObj } : x); save('actions', na); return na })
      setEditId(null)
      
    } catch (error) {
      alert(`❌ Düzenleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:10, egzersiz:15, ogrenme:-5`)
    }
  }

  // Analiz hesaplama
  const filteredActions = () => {
    let filtered = actions()
    if (period() !== 'all') {
      const now = new Date()
      let start
      if (period() === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      else if (period() === 'week') start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() || 7) + 1)
      else if (period() === 'month') start = new Date(now.getFullYear(), now.getMonth(), 1)
      if (start) filtered = filtered.filter(a => new Date(a.date) >= start)
    }
    if (search()) filtered = filtered.filter(a => (a.name && a.name.toLowerCase().includes(search().toLowerCase())) || (a.description && a.description.toLowerCase().includes(search().toLowerCase())))
    if (attr()) filtered = filtered.filter(a => a.points && Object.keys(a.points).includes(attr()))
    return filtered
  }
  const analyticsTotal = () => {
    const total = {}
    for (const a of filteredActions()) {
      for (const [k, v] of Object.entries(a.points || {})) {
        total[k] = (total[k] || 0) + v
      }
    }
    return total
  }

  // Envanter arama
  const inventoryList = () => invSearch() ? inventory().filter(i => (i.name && i.name.toLowerCase().includes(invSearch().toLowerCase())) || (i.description && i.description.toLowerCase().includes(invSearch().toLowerCase()))) : inventory()

  // Ödül ekle
  const addReward = (e) => {
    e.preventDefault()
    
    try {
      // Kriter validasyonu - ödüller için de aynı format
      if (rewardCriteria().trim()) {
        validatePoints(rewardCriteria())
      }
      
      setRewards(r => { const nr = [...r, { id: Date.now(), name: rewardName(), description: rewardDesc(), criteria: rewardCriteria() }]; save('rewards', nr); return nr })
      setRewardName(''); setRewardDesc(''); setRewardCriteria('')
      
    } catch (error) {
      alert(`❌ Ödül Ekleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:100, egzersiz:50`)
    }
  }

  // Ödül sil
  const deleteReward = (id) => {
    setRewards(r => { const nr = r.filter(x => x.id !== id); save('rewards', nr); return nr })
  }

  // Ödül satın al
  const buyReward = (reward) => {
    setRewardMsg("")
    // Çoklu kriter desteği
    const critArr = (reward.criteria || "").split(',').map(c => c.trim()).filter(Boolean);
    // Önce uygunluk kontrolü (zaten arayüzde de var ama güvenlik için tekrar bak)
    const allEnough = critArr.every(c => {
      const [attr, value] = c.split(':');
      if (!attr || !value) return false;
      // Pozitif değerli kriterlerde yeterli puan kontrolü
      return Number(value) > 0 ? getUserPoints(attr) >= Number(value) : true;
    });
    if (!allEnough) {
      setRewardMsg("Yetersiz puan!");
      return;
    }
    // Her nitelikten ilgili puanları -1 ile çarpıp işle
    const pointsObj = Object.fromEntries(critArr.map(c => {
      const [attr, value] = c.split(':');
      return [attr.trim(), -1 * Number(value)];
    }));
    Object.keys(pointsObj).forEach(k => pointsObj[k] = Number(pointsObj[k]))
    setActions(a => { const na = [...a, { id: Date.now(), name: `Ödül satın alındı: ${reward.name}`, description: reward.description, date: new Date().toISOString(), points: pointsObj, rewardId: reward.id }]; save('actions', na); return na })
    // Envantere ekle
    const existing = inventory().find(i => i.name === reward.name)
    if (existing) setInventory(inv => { const ni = inv.map(i => i.name === reward.name ? { ...i, amount: i.amount + 1 } : i); save('inventory', ni); return ni })
    else setInventory(inv => { const ni = [...inv, { id: Date.now(), name: reward.name, description: reward.description, amount: 1, rewardId: reward.id }]; save('inventory', ni); return ni })
    setRewardMsg("Başarıyla satın alındı ve envantere eklendi!")
  }

  // Envanterden sil
  const deleteInventory = (id) => {
    setInventory(inv => { const ni = inv.filter(i => i.id !== id); save('inventory', ni); return ni })
  }

  // Envanterden bir adet kullan
  const useInventory = (id) => {
    setInventory(inv => {
      const ni = inv.map(i => i.id === id ? { ...i, amount: i.amount - 1 } : i).filter(i => i.amount > 0)
      save('inventory', ni)
      return ni
    })
  }

  // JSON dışa aktar
  const exportData = () => {
    const data = {
      tasks: tasks(),
      actions: actions(),
      inventory: inventory(),
      rewards: rewards(),
      achievements: achievements()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gamify-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // JSON içe aktar
  const importData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        setTasks(data.tasks || []); save('tasks', data.tasks || [])
        setActions(data.actions || []); save('actions', data.actions || [])
        setInventory(data.inventory || []); save('inventory', data.inventory || [])
        setRewards(data.rewards || []); save('rewards', data.rewards || [])
        setAchievements(data.achievements || []); save('achievements', data.achievements || [])
      } catch {}
    }
    reader.readAsText(file)
  }

  // Ödül arama ve filtreleme
  const [rewardSearch, setRewardSearch] = createSignal("");
  const [rewardAttr, setRewardAttr] = createSignal("");
  const [rewardOnlyEligible, setRewardOnlyEligible] = createSignal(false);

  // Başarı arama ve filtreleme
  const getFilteredAchievements = () => {
    let list = achievements();
    if (achievementSearch()) list = list.filter(a => a.name && a.name.toLowerCase().includes(achievementSearch().toLowerCase()));
    if (achievementAttr()) list = list.filter(a => (a.criteria||"").toLowerCase().includes(achievementAttr().toLowerCase()));
    return list;
  };

  // Kullanıcının puanlarını hesaplayan yardımcı fonksiyon (değişmedi)
  const getUserPoints = (attr) => {
    return actions().reduce((sum, a) => sum + (a.points && a.points[attr] ? a.points[attr] : 0), 0);
  };

  // Bir ödül için tüm kriterler sağlanıyor mu?
  const isRewardEligible = (criteria) => {
    if (!criteria) return false;
    const critArr = criteria.split(',').map(c => c.trim()).filter(Boolean);
    if (critArr.length === 0) return false;
    return critArr.every(c => {
      const [attr, value] = c.split(':');
      if (!attr || !value) return false;
      return getUserPoints(attr) >= Number(value);
    });
  };

  // Filtrelenmiş ödül listesi (güncellendi)
  const filteredRewards = () => {
    let list = rewards();
    if (rewardSearch()) list = list.filter(r => r.name && r.name.toLowerCase().includes(rewardSearch().toLowerCase()));
    if (rewardAttr()) list = list.filter(r => (r.criteria||"").toLowerCase().includes(rewardAttr().toLowerCase()));
    if (rewardOnlyEligible()) {
      list = list.filter(r => isRewardEligible(r.criteria));
    }
    return list;
  };

  // Tekrarlı eylem ekle
  const addRecurrent = (e) => {
    e.preventDefault();
    
    try {
      // Validasyon
      const pointsObj = validatePoints(recPoints())
      
      const item = { id: Date.now(), name: recName(), description: recDesc(), points: pointsObj, applied: 0 };
      setRecurrents(r => { const nr = [...r, item]; save('recurrents', nr); return nr });
      setRecName(""); setRecDesc(""); setRecPoints("");
      
    } catch (error) {
      alert(`❌ Tekrarlı Eylem Ekleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:10, egzersiz:15, ogrenme:-5`)
    }
  };
  // Tekrarlı eylem arama
  const filteredRecurrents = () => recSearch() ? recurrents().filter(r => (r.name && r.name.toLowerCase().includes(recSearch().toLowerCase())) || (r.description && r.description.toLowerCase().includes(recSearch().toLowerCase()))) : recurrents();
  // Tekrarlı eylem şablonunu loga ekle
  const addRecurrentToLog = (item) => {
    const log = {
      id: Date.now(),
      name: item.name,
      description: item.description,
      points: item.points,
      date: new Date().toISOString()
    };
    setActions(a => { const na = [...a, log]; save('actions', na); return na })
  };
  // Tekrarlı eylem uygula (log ekle ve sayaç artır)
  const applyRecurrent = (item) => {
    // Log ekle
    const log = { id: Date.now(), name: item.name, description: item.description, points: item.points, date: new Date().toISOString() };
    setActions(a => { const na = [...a, log]; save('actions', na); return na });
    // Sayaç artır
    setRecurrents(r => {
      const nr = r.map(x => x.id === item.id ? { ...x, applied: (x.applied || 0) + 1 } : x);
      save('recurrents', nr);
      return nr;
    });
    // Başarıları kontrol et
    setTimeout(() => checkAndUpdateAchievements(), 100);
  };
  // Tekrarlı eylem sil fonksiyonu
  const deleteRecurrent = (id) => {
    setRecurrents(r => { const nr = r.filter(x => x.id !== id); save('recurrents', nr); return nr });
  };

  // Başarı (Achievement) fonksiyonları
  const addAchievement = (e) => {
    e.preventDefault()
    
    try {
      // Kriter validasyonu
      if (achievementCriteria().trim()) {
        validatePoints(achievementCriteria())
      }
      
      // Prestij puanı validasyonu
      const prestigeValue = Number(achievementPrestige()) || prestigeSettings().pointsPerAchievement
      if (isNaN(prestigeValue) || prestigeValue < 0 || prestigeValue > 1000) {
        throw new Error('Prestij puanı 0-1000 arasında bir sayı olmalıdır!')
      }
      
      const newAchievement = {
        id: Date.now(),
        name: achievementName(),
        description: achievementDesc(),
        criteria: achievementCriteria(),
        prestigePoints: prestigeValue,
        earned: false,
        earnedDate: null
      }
      setAchievements(a => { const na = [...a, newAchievement]; save('achievements', na); return na })
      setAchievementName(''); setAchievementDesc(''); setAchievementCriteria(''); setAchievementPrestige('')
      
    } catch (error) {
      alert(`❌ Başarı Ekleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:50, egzersiz:100`)
    }
  }

  // Modal uyumlu addAchievement overload
  const addAchievementFromModal = (name, description, criteria, prestigePoints) => {
    try {
      // Kriter validasyonu
      if (criteria && criteria.trim()) {
        validatePoints(criteria)
      }
      
      // Prestij puanı validasyonu
      const prestigeValue = Number(prestigePoints) || prestigeSettings().pointsPerAchievement
      if (isNaN(prestigeValue) || prestigeValue < 0 || prestigeValue > 1000) {
        throw new Error('Prestij puanı 0-1000 arasında bir sayı olmalıdır!')
      }
      
      const newAchievement = {
        id: Date.now(),
        name: name,
        description: description,
        criteria: criteria,
        prestigePoints: prestigeValue,
        earned: false,
        earnedDate: null
      }
      setAchievements(a => { const na = [...a, newAchievement]; save('achievements', na); return na })
      
    } catch (error) {
      alert(`❌ Başarı Ekleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:50, egzersiz:100`)
      throw error
    }
  }

  const deleteAchievement = (id) => {
    setAchievements(a => { const na = a.filter(x => x.id !== id); save('achievements', na); return na })
  }

  const startEditAchievement = (achievement) => {
    setEditAchievementId(achievement.id)
    setEditAchievementName(achievement.name)
    setEditAchievementDesc(achievement.description)
    setEditAchievementCriteria(achievement.criteria)
    setEditAchievementPrestige((achievement.prestigePoints || prestigeSettings().pointsPerAchievement).toString())
  }

  const saveEditAchievement = (e) => {
    e.preventDefault()
    
    try {
      // Kriter validasyonu
      if (editAchievementCriteria().trim()) {
        validatePoints(editAchievementCriteria())
      }
      
      // Prestij puanı validasyonu
      const prestigeValue = Number(editAchievementPrestige()) || prestigeSettings().pointsPerAchievement
      if (isNaN(prestigeValue) || prestigeValue < 0 || prestigeValue > 1000) {
        throw new Error('Prestij puanı 0-1000 arasında bir sayı olmalıdır!')
      }
      
      setAchievements(a => { 
        const na = a.map(x => x.id === editAchievementId() ? 
          { 
            ...x, 
            name: editAchievementName(), 
            description: editAchievementDesc(), 
            criteria: editAchievementCriteria(),
            prestigePoints: prestigeValue
          } : x
        ); 
        save('achievements', na); 
        return na 
      })
      setEditAchievementId(null)
      
    } catch (error) {
      alert(`❌ Başarı Düzenleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:50, egzersiz:100`)
    }
  }

  // Başarı güncelleme fonksiyonu
  const updateAchievement = (id, updatedData) => {
    try {
      // Kriter validasyonu
      if (updatedData.criteria && updatedData.criteria.trim()) {
        validatePoints(updatedData.criteria)
      }
      
      // Prestij puanı validasyonu
      const prestigeValue = Number(updatedData.prestigePoints) || prestigeSettings().pointsPerAchievement
      if (isNaN(prestigeValue) || prestigeValue < 0 || prestigeValue > 1000) {
        throw new Error('Prestij puanı 0-1000 arasında bir sayı olmalıdır!')
      }
      
      setAchievements(a => {
        const na = a.map(achievement => {
          if (achievement.id === id) {
            return {
              ...achievement,
              name: updatedData.name || achievement.name,
              description: updatedData.description || achievement.description,
              criteria: updatedData.criteria || achievement.criteria,
              prestigePoints: prestigeValue
            }
          }
          return achievement
        })
        save('achievements', na)
        return na
      })
      
    } catch (error) {
      alert(`❌ Başarı Güncelleme Hatası: ${error.message}\n\nÖrnek doğru format:\ntemizlik:50, egzersiz:100`)
      throw error
    }
  }

  // Başarı kriterini kontrol et - çoklu kriter desteği (TÜM kriterler sağlanmalı)
  const isAchievementEarned = (criteria) => {
    if (!criteria) return false;
    const critArr = criteria.split(',').map(c => c.trim()).filter(Boolean);
    if (critArr.length === 0) return false;
    
    // HER kriter için kontrol et - hepsi sağlanmalı
    return critArr.every(c => {
      const parts = c.split(':');
      if (parts.length !== 2) return false;
      
      const attr = parts[0].trim();
      const value = parts[1].trim();
      
      if (!attr || !value) return false;
      
      const userPoints = getUserPoints(attr);
      const requiredPoints = Number(value);
      
      // NaN kontrolü
      if (isNaN(requiredPoints)) return false;
      
      console.log(`Kriter kontrol: ${attr} - Sahip: ${userPoints}, Gerekli: ${requiredPoints}, Sağlandı: ${userPoints >= requiredPoints}`);
      
      return userPoints >= requiredPoints;
    });
  };

  // Başarı durumunu kontrol et (earned flag veya gerçek zamanlı kontrol)
  const isAchievementCompleted = (achievement) => {
    return achievement.earned || isAchievementEarned(achievement.criteria);
  };

  // Filtrelenmiş başarı listesi
  const filteredAchievementsList = () => {
    let list = achievements();
    if (achievementSearch()) {
      list = list.filter(a => 
        (a.name && a.name.toLowerCase().includes(achievementSearch().toLowerCase())) ||
        (a.description && a.description.toLowerCase().includes(achievementSearch().toLowerCase()))
      );
    }
    if (achievementAttr()) {
      list = list.filter(a => (a.criteria||"").toLowerCase().includes(achievementAttr().toLowerCase()));
    }
    return list;
  };

  // Başarıları otomatik kontrol et ve kazanılanları işaretle
  const checkAndUpdateAchievements = () => {
    let newPrestigeEarned = 0
    
    setAchievements(a => {
      const na = a.map(achievement => {
        if (!achievement.earned && isAchievementEarned(achievement.criteria)) {
          // Prestij puanı ekle
          if (prestigeSettings().enabled) {
            newPrestigeEarned += achievement.prestigePoints || prestigeSettings().pointsPerAchievement
          }
          return { ...achievement, earned: true, earnedDate: new Date().toISOString() };
        }
        return achievement;
      });
      save('achievements', na);
      return na;
    });

    // Prestij puanlarını güncelle
    if (newPrestigeEarned > 0) {
      setPrestigePoints(p => {
        const newTotal = p + newPrestigeEarned
        save('prestigePoints', newTotal)
        return newTotal
      })
      
      // Bildirim göster
      if (prestigeSettings().enabled) {
        alert(`🏆 Tebrikler! ${newPrestigeEarned} prestij puanı kazandınız!\n\nToplam Prestij: ${prestigePoints() + newPrestigeEarned}`)
      }
    }
  };

  // Prestij seviyesi hesapla
  const getPrestigeLevel = () => {
    const points = prestigePoints()
    if (points < 50) return { level: 1, name: 'Acemi', color: 'text-gray-600', icon: '🌱' }
    if (points < 150) return { level: 2, name: 'Deneyimli', color: 'text-green-600', icon: '🌿' }
    if (points < 300) return { level: 3, name: 'Usta', color: 'text-blue-600', icon: '⭐' }
    if (points < 500) return { level: 4, name: 'Uzman', color: 'text-purple-600', icon: '💎' }
    if (points < 750) return { level: 5, name: 'Efsane', color: 'text-orange-600', icon: '👑' }
    return { level: 6, name: 'Tanrısal', color: 'text-red-600', icon: '🔥' }
  }

  // Prestij ayarlarını güncelle
  const updatePrestigeSettings = (newSettings) => {
    setPrestigeSettings(s => {
      const updated = { ...s, ...newSettings }
      save('prestigeSettings', updated)
      return updated
    })
  }

  // Puan validasyon fonksiyonu
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
        throw new Error(`"${trimmedKey}" için puan değeri boş olamaz!`)
      }
      
      const numValue = Number(trimmedValue)
      
      // Sayı kontrolü
      if (isNaN(numValue)) {
        throw new Error(`"${trimmedKey}" için geçersiz sayı: "${trimmedValue}". Sayı olmalıdır.`)
      }
      
      // Aşırı büyük/küçük sayı kontrolü
      if (numValue > 10000 || numValue < -10000) {
        throw new Error(`"${trimmedKey}" için puan çok büyük/küçük: ${numValue}. -10000 ile 10000 arasında olmalıdır.`)
      }
      
      validatedPoints[trimmedKey] = numValue
    }
    
    return validatedPoints
  }

  // Todo işlemleri
  const addTodo = (e) => {
    e.preventDefault()
    
    if (!name().trim()) return
    
    // Points değerini güvenli şekilde parse et
    let pointsValue = {}
    if (points() && points().trim()) {
      try {
        pointsValue = validatePoints(points())
      } catch (err) {
        // Eğer validasyon başarısız olursa, basit sayı olarak dene
        const numValue = parseInt(points())
        if (!isNaN(numValue)) {
          pointsValue = { exp: numValue }
        } else {
          // Hatalı format uyarısını göster ve fonksiyondan çık
          alert(`❌ Puan formatı hatalı: ${err.message}\n\nÖrnek doğru format:\ntemizlik:10, egzersiz:15, ogrenme:-5\n\nVeya sadece sayı: 50`)
          return
        }
      }
    }
    
    const todo = { 
      id: Date.now(), 
      name: name().trim(), 
      description: description().trim(), 
      points: pointsValue,
      date: new Date().toISOString(),
      completed: false,
      status: 'pending',
      priority: 'normal',
      category: '',
      dueDate: '',
      itemReward: '',
      itemAmount: 1,
      expReward: 0,
      createdAt: new Date().toISOString()
    }
    
    setTodos(t => { const nt = [...t, todo]; save('todos', nt); return nt })
    setName(''); setDescription(''); setPoints('')
    
    // Event tetikle
    triggerEvent('onTaskAdd', { task: todo })
  }

  const deleteTodo = (id) => {
    const todo = todos().find(t => t.id === id)
    if (todo) {
      setTodos(t => { const nt = t.filter(x => x.id !== id); save('todos', nt); return nt })
      // Event tetikle
      triggerEvent('onTaskRemove', { task: todo })
    }
  }

  const completeTodo = (id) => {
    setTodos(t => {
      const nt = t.map(todo => {
        if (todo.id === id && !todo.completed) {
          // Ödül ver
          if (todo.itemReward && todo.itemAmount) {
            const currentInventory = inventory() || []
            const existingItem = currentInventory.find(item => item.name === todo.itemReward)
            
            if (existingItem) {
              existingItem.amount += todo.itemAmount
            } else {
              currentInventory.push({
                id: Date.now(),
                name: todo.itemReward,
                amount: todo.itemAmount,
                description: `${todo.name} görevinden kazanıldı`,
                earnedAt: new Date().toISOString()
              })
            }
            
            setInventory([...currentInventory])
            save('inventory', currentInventory)
          }
          
          // Aynı zamanda log'a da ekle (gerçekleştirilen eylem olarak)
          const logEntry = {
            id: Date.now() + 1, // Farklı ID
            name: todo.name,
            description: todo.description + ' (Todo tamamlandı)',
            points: todo.points,
            date: new Date().toISOString()
          }
          setActions(a => { const na = [...a, logEntry]; save('actions', na); return na })
          
          // Scriptleri çalıştır (onTaskComplete event)
          const completedTodo = { ...todo, completed: true, completedAt: new Date().toISOString(), status: 'completed' }
          
          // Göreve atanmış scriptleri bul ve çalıştır
          if (completedTodo.selectedScripts && completedTodo.selectedScripts.length > 0) {
            console.log(`[completeTodo] Scriptler çalıştırılacak:`, completedTodo.selectedScripts)
            const currentScripts = scripts() || []
            completedTodo.selectedScripts.forEach(scriptId => {
              const script = currentScripts.find(s => s.id === scriptId)
              if (script) {
                console.log(`[completeTodo] Script bulundu: ${script.name}`)
                try {
                  executeScript(script, { task: completedTodo, event: 'onTaskComplete' })
                } catch (error) {
                  console.error(`Script "${script.name}" hata verdi:`, error)
                }
              } else {
                console.warn(`[completeTodo] Script bulunamadı: ${scriptId}`)
              }
            })
          } else {
            console.log(`[completeTodo] Seçili script yok`, completedTodo)
          }
          
          return completedTodo
        }
        return todo
      })
      save('todos', nt)
      return nt
    })
  }

  const undoTodo = (id) => {
    setTodos(t => {
      const nt = t.map(todo => {
        if (todo.id === id && todo.completed) {
          // Ödülü geri al
          if (todo.itemReward && todo.itemAmount) {
            const currentInventory = inventory() || []
            const existingItem = currentInventory.find(item => item.name === todo.itemReward)
            
            if (existingItem) {
              existingItem.amount = Math.max(0, existingItem.amount - todo.itemAmount)
              if (existingItem.amount === 0) {
                const index = currentInventory.indexOf(existingItem)
                currentInventory.splice(index, 1)
              }
            }
            
            setInventory([...currentInventory])
            save('inventory', currentInventory)
          }
          
          return { ...todo, completed: false, completedAt: null, status: 'pending' }
        }
        return todo
      })
      save('todos', nt)
      return nt
    })
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <div class="flex h-screen">
        {/* Desktop Sidebar */}
        <div class="hidden lg:flex flex-col w-64 bg-white shadow-lg border-r border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              🎮 Gamify
            </h1>
          </div>
          <nav class="flex-1 p-4 space-y-2">
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='todos' ? 'bg-green-600 text-white shadow-md' : 'text-green-700 hover:bg-green-50'
              }`} 
              onClick={()=>setTab('todos')}
            >
              <span class="mr-3">✅</span>
              Görevler
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='log' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-700 hover:bg-blue-50'
              }`} 
              onClick={()=>setTab('log')}
            >
              <span class="mr-3">📋</span>
              Loglar
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='analiz' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-700 hover:bg-purple-50'
              }`} 
              onClick={()=>setTab('analiz')}
            >
              <span class="mr-3">📊</span>
              Analiz
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='envanter' ? 'bg-green-600 text-white shadow-md' : 'text-green-700 hover:bg-green-50'
              }`} 
              onClick={()=>setTab('envanter')}
            >
              <span class="mr-3">📦</span>
              Envanter
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='odul' ? 'bg-yellow-500 text-white shadow-md' : 'text-yellow-700 hover:bg-yellow-50'
              }`} 
              onClick={()=>setTab('odul')}
            >
              <span class="mr-3">🎁</span>
              Ödüller
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='basari' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-700 hover:bg-orange-50'
              }`} 
              onClick={()=>setTab('basari')}
            >
              <span class="mr-3">🏆</span>
              Başarılar
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='tekrarli' ? 'bg-pink-500 text-white shadow-md' : 'text-pink-700 hover:bg-pink-50'
              }`} 
              onClick={()=>setTab('tekrarli')}
            >
              <span class="mr-3">🔄</span>
              Tekrarlı
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='scripts' ? 'bg-purple-700 text-white shadow-md' : 'text-purple-700 hover:bg-purple-50'
              }`} 
              onClick={()=>setTab('scripts')}
            >
              <span class="mr-3">🚀</span>
              Scriptler
            </button>
            <button 
              class={`w-full flex items-center px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                tab()==='ayarlar' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-50'
              }`} 
              onClick={()=>setTab('ayarlar')}
            >
              <span class="mr-3">⚙️</span>
              Ayarlar
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div class="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Tab Bar */}
          <div class="lg:hidden bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200 p-2 sticky top-0 z-10">
            <div class="flex overflow-x-auto scrollbar-hide gap-1 sm:gap-2 pb-1">
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='todos' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 hover:bg-green-50'}`} onClick={()=>setTab('todos')}>
                ✅ <span class="hidden sm:inline">Görevler</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='log' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 hover:bg-blue-50'}`} onClick={()=>setTab('log')}>
                📋 <span class="hidden sm:inline">Loglar</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='analiz' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-purple-600 hover:bg-purple-50'}`} onClick={()=>setTab('analiz')}>
                📊 <span class="hidden sm:inline">Analiz</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='envanter' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-700 hover:bg-green-50'}`} onClick={()=>setTab('envanter')}>
                📦 <span class="hidden sm:inline">Envanter</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='odul' ? 'bg-yellow-500 text-white shadow-md' : 'bg-white text-yellow-700 hover:bg-yellow-50'}`} onClick={()=>setTab('odul')}>
                🎁 <span class="hidden sm:inline">Ödüller</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='basari' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-700 hover:bg-orange-50'}`} onClick={()=>setTab('basari')}>
                🏆 <span class="hidden sm:inline">Başarılar</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='tekrarli' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-pink-700 hover:bg-pink-50'}`} onClick={()=>setTab('tekrarli')}>
                🔄 <span class="hidden sm:inline">Tekrarlı</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='scripts' ? 'bg-purple-700 text-white shadow-md' : 'bg-white text-purple-700 hover:bg-purple-50'}`} onClick={()=>setTab('scripts')}>
                🚀 <span class="hidden sm:inline">Scriptler</span>
              </button>
              <button class={`px-2 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${tab()==='ayarlar' ? 'bg-gray-700 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'}`} onClick={()=>setTab('ayarlar')}>
                ⚙️ <span class="hidden sm:inline">Ayarlar</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div class="flex-1 overflow-auto">
            <div class="p-4 lg:p-6">
        <Show when={tab()==='todos'}>
          <TodoTab 
            // Todo özel state ve fonksiyonları
            todos={todos} setTodos={setTodos}
            addTodo={addTodo} deleteTodo={deleteTodo}
            completeTodo={completeTodo} undoTodo={undoTodo}
            // Görev ekleme için genel alanlar (todo ile paylaşılan)
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            points={points} setPoints={setPoints}
            // Envanter referansı
            inventory={inventory} setInventory={setInventory}
            // Scripts referansı
            scripts={scripts}
          />
        </Show>
        <Show when={tab()==='log'}>
          <LogTab 
            actions={actions} deleteAction={deleteAction}
            editId={editId} setEditId={setEditId}
            editName={editName} setEditName={setEditName}
            editDescription={editDescription} setEditDescription={setEditDescription}
            editPoints={editPoints} setEditPoints={setEditPoints}
            startEdit={startEdit} saveEdit={saveEdit}
          />
        </Show>
        <Show when={tab()==='analiz'}>
          <AnalysisTab 
            period={period} setPeriod={setPeriod}
            search={search} setSearch={setSearch}
            attr={attr} setAttr={setAttr}
            analyticsTotal={analyticsTotal} filteredActions={filteredActions}
            editId={editId} setEditId={setEditId}
            editName={editName} setEditName={setEditName}
            editDescription={editDescription} setEditDescription={setEditDescription}
            editPoints={editPoints} setEditPoints={setEditPoints}
            startEdit={startEdit} saveEdit={saveEdit} deleteAction={deleteAction}
            prestigePoints={prestigePoints} 
            getPrestigeLevel={getPrestigeLevel}
            prestigeSettings={prestigeSettings}
          />
        </Show>
        <Show when={tab()==='envanter'}>
          <InventoryTab 
            invSearch={invSearch} setInvSearch={setInvSearch}
            inventoryList={inventoryList} useInventory={useInventory}
            deleteInventory={deleteInventory}
          />
        </Show>
        <Show when={tab()==='odul'}>
          <RewardsTab 
            rewardSearch={rewardSearch} setRewardSearch={setRewardSearch}
            rewardAttr={rewardAttr} setRewardAttr={setRewardAttr}
            rewardOnlyEligible={rewardOnlyEligible} setRewardOnlyEligible={setRewardOnlyEligible}
            rewardMsg={rewardMsg} rewardName={rewardName} setRewardName={setRewardName}
            rewardDesc={rewardDesc} setRewardDesc={setRewardDesc}
            rewardCriteria={rewardCriteria} setRewardCriteria={setRewardCriteria}
            addReward={addReward} filteredRewards={filteredRewards}
            isRewardEligible={isRewardEligible} getUserPoints={getUserPoints}
            buyReward={buyReward} deleteReward={deleteReward}
          />
        </Show>
        <Show when={tab()==='basari'}>
          <AchievementsTab 
            achievements={achievements} isAchievementCompleted={isAchievementCompleted}
            achievementSearch={achievementSearch} setAchievementSearch={setAchievementSearch}
            achievementAttr={achievementAttr} setAchievementAttr={setAchievementAttr}
            achievementName={achievementName} setAchievementName={setAchievementName}
            achievementDesc={achievementDesc} setAchievementDesc={setAchievementDesc}
            achievementCriteria={achievementCriteria} setAchievementCriteria={setAchievementCriteria}
            achievementPrestige={achievementPrestige} setAchievementPrestige={setAchievementPrestige}
            addAchievement={addAchievement} addAchievementFromModal={addAchievementFromModal}
            updateAchievement={updateAchievement} 
            filteredAchievementsList={filteredAchievementsList}
            deleteAchievement={deleteAchievement} getUserPoints={getUserPoints}
            prestigeSettings={prestigeSettings}
          />
        </Show>
        <Show when={tab()==='tekrarli'}>
          <RecurrentTab 
            recName={recName} setRecName={setRecName}
            recDesc={recDesc} setRecDesc={setRecDesc}
            recPoints={recPoints} setRecPoints={setRecPoints}
            addRecurrent={addRecurrent} recSearch={recSearch} setRecSearch={setRecSearch}
            filteredRecurrents={filteredRecurrents} applyRecurrent={applyRecurrent}
            deleteRecurrent={deleteRecurrent}
          />
        </Show>
        <Show when={tab()==='scripts'}>
          <ScriptsTab 
            scripts={scripts}
            setScripts={setScripts}
            gameAPI={gameAPI}
            executeScript={executeScript}
          />
        </Show>
        <Show when={tab()==='ayarlar'}>
          <SettingsTab 
            exportData={exportData} 
            importData={importData}
            prestigePoints={prestigePoints}
            prestigeSettings={prestigeSettings}
            updatePrestigeSettings={updatePrestigeSettings}
            getPrestigeLevel={getPrestigeLevel}
          />
        </Show>
            </div>
          </div>
          
          {/* Global Stats - Bottom Section */}
          <div class="bg-white border-t border-gray-200 p-4 lg:p-6">
            <div class="max-w-7xl mx-auto">
              <h3 class="text-lg font-bold text-gray-800 mb-4">📊 Genel İstatistikler</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <div class="flex items-center">
                    <div class="p-2 bg-blue-500 rounded-lg mr-3">
                      <span class="text-xl">📋</span>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Toplam Eylem</p>
                      <p class="text-xl font-bold text-blue-600">{actions().length}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                  <div class="flex items-center">
                    <div class="p-2 bg-green-500 rounded-lg mr-3">
                      <span class="text-xl">✅</span>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Tamamlanan Görev</p>
                      <p class="text-xl font-bold text-green-600">{todos().filter(t => t.completed).length}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <div class="flex items-center">
                    <div class="p-2 bg-yellow-500 rounded-lg mr-3">
                      <span class="text-xl">🎯</span>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Toplam Puan</p>
                      <p class="text-xl font-bold text-yellow-600">{getUserPoints()}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div class="flex items-center">
                    <div class="p-2 bg-purple-500 rounded-lg mr-3">
                      <span class="text-xl">🏆</span>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">Prestij Seviyesi</p>
                      <p class="text-xl font-bold text-purple-600">{getPrestigeLevel()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
}

export default App
