import { createSignal } from 'solid-js'

export default function SettingsTab(props) {
  const { 
    exportData, importData, prestigePoints, prestigeSettings, 
    updatePrestigeSettings, getPrestigeLevel 
  } = props
  
  const [selectedTheme, setSelectedTheme] = createSignal(localStorage.getItem('theme') || 'default')
  const [autoSave, setAutoSave] = createSignal(localStorage.getItem('autoSave') !== 'false')
  const [notifications, setNotifications] = createSignal(localStorage.getItem('notifications') !== 'false')
  const [language, setLanguage] = createSignal(localStorage.getItem('language') || 'tr')
  const [dataStats, setDataStats] = createSignal(null)

  // Veri istatistikleri hesapla
  const updateDataStats = () => {
    try {
      const actions = JSON.parse(localStorage.getItem('actions') || '[]')
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]')
      const rewards = JSON.parse(localStorage.getItem('rewards') || '[]')
      const achievements = JSON.parse(localStorage.getItem('achievements') || '[]')
      const recurrents = JSON.parse(localStorage.getItem('recurrents') || '[]')
      
      const totalSize = new Blob([localStorage.getItem('actions') || '', 
                                localStorage.getItem('inventory') || '',
                                localStorage.getItem('rewards') || '',
                                localStorage.getItem('achievements') || '',
                                localStorage.getItem('recurrents') || '']).size

      setDataStats({
        actions: actions.length,
        inventory: inventory.length,
        rewards: rewards.length,
        achievements: achievements.length,
        recurrents: recurrents.length,
        totalSize: (totalSize / 1024).toFixed(2) // KB
      })
    } catch (error) {
      console.error('Veri istatistikleri hesaplanırken hata:', error)
    }
  }

  // Ayarları kaydet
  const saveSettings = () => {
    localStorage.setItem('theme', selectedTheme())
    localStorage.setItem('autoSave', autoSave().toString())
    localStorage.setItem('notifications', notifications().toString())
    localStorage.setItem('language', language())
    
    // Tema değişikliğini uygula
    document.documentElement.className = selectedTheme()
    
    alert('✅ Ayarlar kaydedildi!')
  }

  // Tema önizleme
  const previewTheme = (theme) => {
    document.documentElement.className = theme
  }

  // Verileri topla (Normalizasyon)
  const normalizeData = () => {
    try {
      const actions = JSON.parse(localStorage.getItem('actions') || '[]')
      
      if (actions.length === 0) {
        alert('❌ Toplanacak log verisi bulunamadı! Önce bazı görevler eklemelisiniz.')
        return
      }

      if (actions.length === 1) {
        alert('❌ Sadece 1 log var, normalizasyon için en az 2 log gerekli.')
        return
      }

      // Tüm puanları kategorilere göre topla
      const totalPoints = {}
      let totalLogCount = actions.length
      
      actions.forEach(log => {
        if (log.points && typeof log.points === 'object') {
          Object.entries(log.points).forEach(([skill, points]) => {
            if (totalPoints[skill]) {
              totalPoints[skill] += parseInt(points) || 0
            } else {
              totalPoints[skill] = parseInt(points) || 0
            }
          })
        }
      })

      // Eğer hiç puan yoksa uyar
      if (Object.keys(totalPoints).length === 0) {
        alert('❌ Log\'larda puan verisi bulunamadı!')
        return
      }

      // İstatistik özeti
      const skillSummary = Object.entries(totalPoints)
        .map(([skill, points]) => `${skill}: ${points} puan`)
        .join('\n• ')

      const totalPointsSum = Object.values(totalPoints).reduce((sum, points) => sum + points, 0)

      // Detaylı onay mesajı
      const confirmMessage = `🔄 VERİ NORMALİZASYONU\n\n` +
        `📊 Toplanacak Data:\n` +
        `• ${totalLogCount} adet log\n` +
        `• ${Object.keys(totalPoints).length} farklı skill kategorisi\n` +
        `• Toplam ${totalPointsSum} puan\n\n` +
        `📋 Skill Dağılımı:\n• ${skillSummary}\n\n` +
        `⚠️ İŞLEM SONUCU:\n` +
        `• Tüm mevcut log'lar SİLİNECEK\n` +
        `• Tek "Normalizasyon" log'u oluşturulacak\n` +
        `• Tüm puanlar korunacak\n\n` +
        `Bu işlem GERİ ALINAMAZ!\n` +
        `Devam etmek istediğinizden emin misiniz?`

      if (!confirm(confirmMessage)) {
        return
      }

      // Son onay
      if (!confirm(`🚨 SON ONAY!\n\n${totalLogCount} log silinecek ve tek log haline getirilecek.\n\nGERÇEKTEN devam etmek istiyor musunuz?`)) {
        return
      }

      // Normalizasyon log'u oluştur
      const normalizationLog = {
        id: Date.now(),
        name: 'Normalizasyon',
        description: `${totalLogCount} görev birleştirildi (${new Date().toLocaleDateString('tr-TR')}). Toplam ${totalPointsSum} puan, ${Object.keys(totalPoints).length} farklı skill kategorisinde toplandı.`,
        points: totalPoints,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        normalized: true,
        originalLogCount: totalLogCount,
        normalizedAt: new Date().toISOString()
      }

      // Yeni actions array'i (sadece normalizasyon log'u)
      const newActions = [normalizationLog]

      // LocalStorage'ı güncelle - sadece actions'ı güncelle (tasks'ı dokunma)
      localStorage.setItem('actions', JSON.stringify(newActions))

      // İstatistikleri güncelle
      updateDataStats()

      // Başarı mesajı
      alert(`✅ NORMALIZASYON TAMAMLANDI!\n\n` +
        `📊 Önceki durum: ${totalLogCount} log\n` +
        `📊 Yeni durum: 1 log\n` +
        `💯 Toplam puan: ${totalPointsSum}\n` +
        `🎯 Skill sayısı: ${Object.keys(totalPoints).length}\n\n` +
        `Tüm verileriniz korundu ve tek log haline getirildi!`)

    } catch (error) {
      console.error('Normalizasyon hatası:', error)
      alert('❌ Normalizasyon sırasında bir hata oluştu: ' + error.message)
    }
  }

  // Bileşen yüklendiğinde istatistikleri hesapla
  setTimeout(updateDataStats, 100)

  return (
    <div class="space-y-6">
      {/* Başlık */}
      <div class="bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg p-6 text-white">
        <h1 class="text-3xl font-bold mb-2">⚙️ Ayarlar</h1>
        <p class="text-gray-200">Uygulamanızı kişiselleştirin ve verilerinizi yönetin</p>
      </div>

      {/* Veri İstatistikleri */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <span class="text-2xl mr-2">📊</span>
          Veri İstatistikleri
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl mb-1">📝</div>
            <div class="text-lg font-bold text-blue-600">{dataStats()?.actions || '0'}</div>
            <div class="text-xs text-gray-600">Eylemler</div>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl mb-1">📦</div>
            <div class="text-lg font-bold text-green-600">{dataStats()?.inventory || '0'}</div>
            <div class="text-xs text-gray-600">Envanter</div>
          </div>
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl mb-1">🎁</div>
            <div class="text-lg font-bold text-purple-600">{dataStats()?.rewards || '0'}</div>
            <div class="text-xs text-gray-600">Ödül</div>
          </div>
          <div class="text-center p-3 bg-yellow-50 rounded-lg">
            <div class="text-2xl mb-1">🏆</div>
            <div class="text-lg font-bold text-yellow-600">{dataStats()?.achievements || '0'}</div>
            <div class="text-xs text-gray-600">Başarı</div>
          </div>
          <div class="text-center p-3 bg-pink-50 rounded-lg">
            <div class="text-2xl mb-1">🔄</div>
            <div class="text-lg font-bold text-pink-600">{dataStats()?.recurrents || '0'}</div>
            <div class="text-xs text-gray-600">Tekrarlı</div>
          </div>
          <div class="text-center p-3 bg-orange-50 rounded-lg">
            <div class="text-2xl mb-1">{getPrestigeLevel ? getPrestigeLevel().icon : '🏆'}</div>
            <div class="text-lg font-bold text-orange-600">{prestigePoints ? prestigePoints() : '0'}</div>
            <div class="text-xs text-gray-600">Prestij</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl mb-1">💾</div>
            <div class="text-lg font-bold text-gray-600">{dataStats()?.totalSize || '0'}</div>
            <div class="text-xs text-gray-600">KB</div>
          </div>
        </div>
        <button 
          class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition"
          onClick={updateDataStats}
        >
          🔄 Yenile
        </button>
      </div>

      {/* Görünüm ve Tema Ayarları */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <span class="text-2xl mr-2">🎨</span>
          Görünüm ve Tema
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tema Seçimi</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                class={`p-3 rounded-lg border-2 transition-all ${selectedTheme() === 'default' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => {setSelectedTheme('default'); previewTheme('default')}}
              >
                <div class="w-full h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded mb-2"></div>
                <div class="text-sm font-medium">Varsayılan</div>
              </button>
              <button 
                class={`p-3 rounded-lg border-2 transition-all ${selectedTheme() === 'dark' ? 'border-gray-700 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => {setSelectedTheme('dark'); previewTheme('dark')}}
              >
                <div class="w-full h-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded mb-2"></div>
                <div class="text-sm font-medium">Koyu</div>
              </button>
              <button 
                class={`p-3 rounded-lg border-2 transition-all ${selectedTheme() === 'nature' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => {setSelectedTheme('nature'); previewTheme('nature')}}
              >
                <div class="w-full h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded mb-2"></div>
                <div class="text-sm font-medium">Doğa</div>
              </button>
              <button 
                class={`p-3 rounded-lg border-2 transition-all ${selectedTheme() === 'sunset' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                onClick={() => {setSelectedTheme('sunset'); previewTheme('sunset')}}
              >
                <div class="w-full h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded mb-2"></div>
                <div class="text-sm font-medium">Gün Batımı</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Uygulama Ayarları */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <span class="text-2xl mr-2">🔧</span>
          Uygulama Ayarları
        </h2>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-semibold text-gray-800">Otomatik Kaydetme</h3>
              <p class="text-sm text-gray-600">Değişiklikler otomatik olarak kaydedilir</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                class="sr-only peer" 
                checked={autoSave()}
                onChange={e => setAutoSave(e.target.checked)}
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-semibold text-gray-800">Bildirimler</h3>
              <p class="text-sm text-gray-600">Başarı ve ödül bildirimleri göster</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                class="sr-only peer" 
                checked={notifications()}
                onChange={e => setNotifications(e.target.checked)}
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="p-4 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">Dil</h3>
            <select 
              class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={language()}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇺🇸 English</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </div>

          {/* Prestij Sistemi Ayarları */}
          <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 class="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              🏆 Prestij Sistemi Ayarları
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-yellow-800">Prestij Sistemi</span>
                  <p class="text-xs text-yellow-700">Başarılar için prestij puanı kazanımı</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    class="sr-only peer" 
                    checked={prestigeSettings && prestigeSettings().enabled}
                    onChange={e => updatePrestigeSettings && updatePrestigeSettings({ enabled: e.target.checked })}
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
              
              <div class="flex flex-col md:flex-row gap-3">
                <div class="flex-1">
                  <label class="text-xs font-medium text-yellow-800 block mb-1">Varsayılan Prestij Puanı</label>
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    class="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={prestigeSettings ? prestigeSettings().pointsPerAchievement : 10}
                    onInput={e => {
                      const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 10))
                      updatePrestigeSettings && updatePrestigeSettings({ pointsPerAchievement: value })
                    }}
                  />
                  <div class="text-xs text-yellow-600 mt-1">Yeni başarılar için varsayılan puan (1-100)</div>
                </div>
                
                <div class="flex-1">
                  <label class="text-xs font-medium text-yellow-800 block mb-1">Mevcut Prestij</label>
                  <div class="px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800 font-semibold">
                    {prestigePoints ? prestigePoints() : 0} puan
                  </div>
                  <div class="text-xs text-yellow-600 mt-1">
                    Seviye: {getPrestigeLevel ? getPrestigeLevel().name : 'Acemi'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t">
          <button 
            class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center"
            onClick={saveSettings}
          >
            <span class="mr-2">💾</span>
            Ayarları Kaydet
          </button>
        </div>
      </div>

      {/* Veri Yönetimi */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <span class="text-2xl mr-2">💾</span>
          Veri Yönetimi
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex flex-col items-center"
            onClick={exportData}
          >
            <div class="text-3xl mb-2">📤</div>
            <div>Verileri İndir</div>
            <div class="text-sm opacity-80">JSON formatında</div>
          </button>
          
          <label class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg cursor-pointer transition-all duration-200 flex flex-col items-center">
            <div class="text-3xl mb-2">📥</div>
            <div>Veri Yükle</div>
            <div class="text-sm opacity-80">JSON dosyasını seç</div>
            <input type="file" accept="application/json" class="hidden" onChange={importData} />
          </label>
          
          <button 
            class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex flex-col items-center"
            onClick={normalizeData}
          >
            <div class="text-3xl mb-2">🔄</div>
            <div>Verileri Topla</div>
            <div class="text-sm opacity-80">Normalizasyon</div>
          </button>
          
          <button 
            class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex flex-col items-center"
            onClick={() => {
              if(confirm('⚠️ Bu işlem geri alınamaz!\n\nTüm verileriniz (günlükler, envanter, ödüller, başarılar, tekrarlı eylemler) kalıcı olarak silinecek.\n\nDevam etmek istediğinizden emin misiniz?')) {
                if(confirm('🚨 SON UYARI!\n\nVerileri silmeden önce yedek almayı unutmayın!\n\nGerçekten tüm verileri silmek istiyor musunuz?')) {
                  localStorage.clear()
                  alert('✅ Tüm veriler silindi. Sayfa yenileniyor...')
                  location.reload()
                }
              }
            }}
          >
            <div class="text-3xl mb-2">🗑️</div>
            <div>Tüm Verileri Sil</div>
            <div class="text-sm opacity-80">Geri alınamaz!</div>
          </button>
        </div>
        
        <div class="mt-6 space-y-4">
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-start">
              <div class="text-yellow-600 text-xl mr-3">⚠️</div>
              <div>
                <h4 class="font-semibold text-yellow-800">Önemli Bilgiler</h4>
                <ul class="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Verileriniz sadece bu tarayıcıda yerel olarak saklanır</li>
                  <li>• Düzenli olarak yedek almanız önerilir</li>
                  <li>• Tarayıcı verileri temizlenirse verileriniz kaybolabilir</li>
                  <li>• Veri içe/dışa aktarımı JSON formatında gerçekleşir</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div class="flex items-start">
              <div class="text-orange-600 text-xl mr-3">🔄</div>
              <div>
                <h4 class="font-semibold text-orange-800">Veri Normalizasyonu Hakkında</h4>
                <ul class="text-sm text-orange-700 mt-1 space-y-1">
                  <li>• Binlerce göreviniz varsa performans için normalizasyon kullanın</li>
                  <li>• Tüm görevlerinizin puanları kategorilere göre toplanır</li>
                  <li>• Tek bir "Normalizasyon" görevi oluşturulur</li>
                  <li>• Mevcut tüm görevler silinir (geri alınamaz!)</li>
                  <li>• Skill puanlarınız korunur, sadece görev geçmişi birleştirilir</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hakkında */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <span class="text-2xl mr-2">ℹ️</span>
          Hakkında
        </h2>
        
        <div class="space-y-4">
          <div class="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div class="text-4xl mb-3">🎮</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Gamify Life</h3>
            <p class="text-gray-600 mb-4">Hayatınızı oyunlaştırın ve hedeflerinize ulaşın!</p>
            <div class="text-sm text-gray-500">
              <p>Sürüm: 2.0.0</p>
              <p>SolidJS ile geliştirildi</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-800 mb-2">🚀 Özellikler</h4>
              <ul class="text-gray-600 space-y-1">
                <li>• Günlük aktivite takibi</li>
                <li>• Skill bazlı puan sistemi</li>
                <li>• Başarı ve ödül sistemi</li>
                <li>• Tekrarlı eylem şablonları</li>
                <li>• Detaylı analiz ve istatistikler</li>
              </ul>
            </div>
            
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-gray-800 mb-2">🛠️ Teknolojiler</h4>
              <ul class="text-gray-600 space-y-1">
                <li>• SolidJS (Frontend)</li>
                <li>• Tailwind CSS (Styling)</li>
                <li>• Vite (Build Tool)</li>
                <li>• Local Storage (Veri)</li>
                <li>• Progressive Web App</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
