import { For, Show, createSignal, createMemo, onMount } from 'solid-js'

export default function ScriptsTab(props) {
  const { scripts, setScripts, gameAPI, executeScript } = props

  // Script editör state
  const [activeScript, setActiveScript] = createSignal(null)
  const [scriptName, setScriptName] = createSignal('')
  const [scriptDescription, setScriptDescription] = createSignal('')
  const [scriptCode, setScriptCode] = createSignal('')
  const [isEditing, setIsEditing] = createSignal(false)
  const [testOutput, setTestOutput] = createSignal('')
  const [showTest, setShowTest] = createSignal(false)
  const [activeTab, setActiveTab] = createSignal('editor') // editor, templates, docs
  const [scriptTemplates, setScriptTemplates] = createSignal([])

  // JSON'dan şablonları yükle
  onMount(async () => {
    try {
      const response = await fetch('/scriptTemplates.json')
      const templates = await response.json()
      setScriptTemplates(templates)
    } catch (error) {
      console.error('Şablonlar yüklenemedi:', error)
      // Fallback şablonlar
      setScriptTemplates([
        {
          name: "🎮 Basit Event Handler",
          description: "Basit event dinleyici örneği",
          code: "// Basit event handler\nif (context.event === 'onTaskComplete') {\n  x.ui.notify('🎉 Görev tamamlandı!');\n  x.inventory.addItem('bonus_coin', 10);\n}"
        }
      ])
    }
  })

  // Yeni script oluştur
  const createNewScript = () => {
    setActiveScript(null)
    setScriptName('')
    setScriptDescription('')
    setScriptCode('')
    setIsEditing(true)
    setTestOutput('')
    setShowTest(false)
  }

  // Script düzenle
  const editScript = (script) => {
    setActiveScript(script)
    setScriptName(script.name)
    setScriptDescription(script.description)
    setScriptCode(script.code)
    setIsEditing(true)
    setTestOutput('')
    setShowTest(false)
  }

  // Script kaydet
  const saveScript = () => {
    if (!scriptName().trim() || !scriptCode().trim()) {
      alert('Script adı ve kodu zorunludur!')
      return
    }

    const script = {
      id: activeScript()?.id || Date.now(),
      name: scriptName().trim(),
      description: scriptDescription().trim(),
      code: scriptCode().trim(),
      createdAt: activeScript()?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const currentScripts = scripts() || []
    
    if (activeScript()) {
      // Güncelle
      const updatedScripts = currentScripts.map(s => s.id === script.id ? script : s)
      setScripts(updatedScripts)
      localStorage.setItem('scripts', JSON.stringify(updatedScripts))
    } else {
      // Yeni ekle
      const newScripts = [...currentScripts, script]
      setScripts(newScripts)
      localStorage.setItem('scripts', JSON.stringify(newScripts))
    }

    setIsEditing(false)
    setActiveScript(script)
    alert('Script başarıyla kaydedildi!')
  }

  // Script sil
  const deleteScript = (scriptId) => {
    if (!confirm('Bu scripti silmek istediğinizden emin misiniz?')) return

    const updatedScripts = scripts().filter(s => s.id !== scriptId)
    setScripts(updatedScripts)
    localStorage.setItem('scripts', JSON.stringify(updatedScripts))
    
    if (activeScript()?.id === scriptId) {
      setActiveScript(null)
      setIsEditing(false)
    }
  }

  // Script test et
  const testScript = () => {
    try {
      setShowTest(true)
      setTestOutput('Script çalıştırılıyor...')

      // Test için sahte task objesi
      const testTask = {
        id: 1,
        name: 'Test Görevi',
        description: 'Bu bir test görevidir',
        category: 'test',
        priority: 'normal',
        completed: true,
        completedAt: new Date().toISOString()
      }

      // Script çalıştır
      const result = executeScript({ code: scriptCode() }, { task: testTask, event: 'test' })

      setTestOutput('✅ Script başarıyla çalıştırıldı!\n\nSonuç: ' + (result || 'undefined'))
    } catch (error) {
      setTestOutput('❌ Script hatası:\n\n' + error.message)
    }
  }

  // Şablon kullan
  const useTemplate = (template) => {
    setScriptName(template.name)
    setScriptDescription(template.description)
    setScriptCode(template.code)
  }

  return (
    <div class="space-y-6 container-safe">
      {/* Başlık */}
      <div class="text-center">
        <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
          🚀 Script Merkezi
        </h1>
        <p class="text-gray-600">
          Görevleriniz için özel scriptler oluşturun ve sistemin gücünü artırın!
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Script Listesi */}
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-4">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-gray-800">📜 Scriptlerim</h2>
              <button
                onClick={createNewScript}
                class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all"
              >
                ➕ Yeni
              </button>
            </div>

            <div class="space-y-2 max-h-96 overflow-y-auto">
              <For each={scripts() || []}>{script => (
                <div class={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeScript()?.id === script.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => editScript(script)}>
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 truncate">{script.name}</h3>
                      {script.description && (
                        <p class="text-xs text-gray-600 mt-1 line-clamp-2">{script.description}</p>
                      )}
                      <p class="text-xs text-gray-400 mt-1">
                        {new Date(script.updatedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScript(script.id)
                      }}
                      class="text-red-400 hover:text-red-600 p-1"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}</For>

              <Show when={!scripts()?.length}>
                <div class="text-center py-8 text-gray-500">
                  <div class="text-4xl mb-2">📜</div>
                  <p>Henüz script yok</p>
                  <p class="text-sm">Yeni butonuna tıklayarak başlayın!</p>
                </div>
              </Show>
            </div>
          </div>

          {/* Şablonlar */}
          <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mt-4">
            <h3 class="font-bold text-purple-700 mb-3">⚡ Hazır Şablonlar</h3>
            <div class="space-y-2">
              <For each={scriptTemplates()}>{template => (
                <button
                  onClick={() => useTemplate(template)}
                  class="w-full text-left p-2 rounded border border-purple-200 hover:border-purple-300 hover:bg-white transition-all"
                >
                  <div class="font-medium text-sm">{template.name}</div>
                  <div class="text-xs text-gray-600">{template.description}</div>
                </button>
              )}</For>
            </div>
          </div>
        </div>

        {/* Script Editör */}
        <div class="lg:col-span-2">
          {/* Tab Navigation */}
          <div class="bg-white rounded-lg shadow-md mb-4">
            <div class="flex border-b">
              <button
                onClick={() => setActiveTab('editor')}
                class={`px-4 py-3 font-medium text-sm transition-all ${
                  activeTab() === 'editor'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                ✏️ Editör
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                class={`px-4 py-3 font-medium text-sm transition-all ${
                  activeTab() === 'templates'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                ⚡ Şablonlar
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                class={`px-4 py-3 font-medium text-sm transition-all ${
                  activeTab() === 'docs'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                📚 API Dokümantasyonu
              </button>
            </div>
          </div>

          {/* Editör Tab */}
          <Show when={activeTab() === 'editor'}>
            {isEditing() ? (
              <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-gray-800">
                  {activeScript() ? '✏️ Script Düzenle' : '➕ Yeni Script'}
                </h2>
                <div class="flex gap-2">
                  <button
                    onClick={testScript}
                    class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                  >
                    🧪 Test Et
                  </button>
                  <button
                    onClick={saveScript}
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                  >
                    💾 Kaydet
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                  >
                    ❌ İptal
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                {/* Script Bilgileri */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Script Adı *</label>
                    <input
                      type="text"
                      value={scriptName()}
                      onInput={e => setScriptName(e.target.value)}
                      placeholder="Örn: Kategori Bonusu"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <input
                      type="text"
                      value={scriptDescription()}
                      onInput={e => setScriptDescription(e.target.value)}
                      placeholder="Script ne yapıyor?"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Kod Editör */}
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">JavaScript Kodu *</label>
                  <textarea
                    value={scriptCode()}
                    onInput={e => setScriptCode(e.target.value)}
                    placeholder="// x.ui.notify('Merhaba Dünya!');"
                    rows="15"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                {/* API Dokümantasyonu */}
                <div class="bg-gray-50 rounded-lg p-4">
                  <h4 class="font-bold text-gray-800 mb-2">🔗 Game API Referansı</h4>
                  <div class="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                    <div class="font-semibold text-gray-700">🎯 Events:</div>
                    <p><code class="bg-white px-1 rounded">context.event</code> - Event tipi (onTaskComplete, onTaskAdd, onTaskRemove, onInventoryAdd, onRewardUse...)</p>
                    <p><code class="bg-white px-1 rounded">context.eventData</code> - Event ile gelen data</p>
                    <p><code class="bg-white px-1 rounded">x.events.trigger(eventName, data)</code> - Manuel event tetikle</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">📋 Tasks:</div>
                    <p><code class="bg-white px-1 rounded">x.tasks.getAllTasks()</code> - Tüm görevler</p>
                    <p><code class="bg-white px-1 rounded">x.tasks.addTask(data)</code> - Yeni görev ekle</p>
                    <p><code class="bg-white px-1 rounded">x.tasks.removeTask(id)</code> - Görev sil</p>
                    <p><code class="bg-white px-1 rounded">x.tasks.completeTask(id)</code> - Görev tamamla</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">📦 Inventory:</div>
                    <p><code class="bg-white px-1 rounded">x.inventory.addItem(name, amount)</code> - Item ekle</p>
                    <p><code class="bg-white px-1 rounded">x.inventory.removeItem(name, amount)</code> - Item çıkar</p>
                    <p><code class="bg-white px-1 rounded">x.inventory.getTotal(name)</code> - Item miktarı</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">🏆 Achievements:</div>
                    <p><code class="bg-white px-1 rounded">x.achievements.unlock(name, desc)</code> - Başarı aç</p>
                    <p><code class="bg-white px-1 rounded">x.achievements.isUnlocked(name)</code> - Başarı kontrolü</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">� Rewards:</div>
                    <p><code class="bg-white px-1 rounded">x.rewards.useReward(id, context)</code> - Ödül kullan</p>
                    <p><code class="bg-white px-1 rounded">x.rewards.addReward(data)</code> - Yeni ödül</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">📊 Logs:</div>
                    <p><code class="bg-white px-1 rounded">x.logs.addLog(data)</code> - Log ekle</p>
                    <p><code class="bg-white px-1 rounded">x.logs.getAllLogs()</code> - Tüm loglar</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">⭐ Prestige:</div>
                    <p><code class="bg-white px-1 rounded">x.prestige.addPoints(points)</code> - Prestij ekle</p>
                    <p><code class="bg-white px-1 rounded">x.prestige.getLevel()</code> - Prestij seviyesi</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">🎨 UI:</div>
                    <p><code class="bg-white px-1 rounded">x.ui.notify(message)</code> - Bildirim göster</p>
                    <p><code class="bg-white px-1 rounded">x.ui.log(message)</code> - Console log</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">�️ Utils:</div>
                    <p><code class="bg-white px-1 rounded">x.utils.getRandomInt(min, max)</code> - Rastgele sayı</p>
                    <p><code class="bg-white px-1 rounded">x.utils.getRandomChoice(array)</code> - Rastgele seçim</p>
                    <p><code class="bg-white px-1 rounded">x.utils.calculateStreak(tasks, days)</code> - Streak hesapla</p>
                    
                    <div class="font-semibold text-gray-700 mt-2">📄 Variables:</div>
                    <p><code class="bg-white px-1 rounded">task</code> - Mevcut görev (onTaskComplete'de)</p>
                  </div>
                </div>

                {/* Test Sonucu */}
                <Show when={showTest()}>
                  <div class="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
                    <h4 class="text-white font-bold mb-2">🔍 Test Sonucu:</h4>
                    <pre class="whitespace-pre-wrap">{testOutput()}</pre>
                  </div>
                </Show>
              </div>
            </div>
            ) : (
              <div class="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <div class="text-4xl mb-4">✨</div>
                <p class="text-lg">Script seçin veya yeni oluşturun</p>
                <p class="text-sm mt-2">Sol taraftan bir script seçarak düzenlemeye başlayın</p>
              </div>
            )}
          </Show>

          {/* Şablonlar Tab */}
          <Show when={activeTab() === 'templates'}>
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">⚡ Script Şablonları</h2>
              <p class="text-gray-600 mb-6">
                Hazır şablonları kullanarak hızlıca script oluşturun. Her şablon farklı senaryolar için optimize edilmiştir.
              </p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <For each={scriptTemplates()}>{template => (
                  <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-3">
                      <h3 class="font-bold text-gray-800">{template.name}</h3>
                      <button
                        onClick={() => useTemplate(template)}
                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                      >
                        Kullan
                      </button>
                    </div>
                    <p class="text-gray-600 text-sm mb-3">{template.description}</p>
                    
                    {/* Kod Önizleme */}
                    <div class="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                      <pre class="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                        {template.code.split('\n').slice(0, 8).join('\n')}
                        {template.code.split('\n').length > 8 ? '\n...' : ''}
                      </pre>
                    </div>
                  </div>
                )}</For>
              </div>
            </div>
          </Show>

          {/* Dokümantasyon Tab */}
          <Show when={activeTab() === 'docs'}>
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">📚 Game API Dokümantasyonu</h2>
              <p class="text-gray-600 mb-6">
                Scriptlerinizde kullanabileceğiniz tüm API fonksiyonları ve event sistemi hakkında detaylı bilgiler.
              </p>

              <div class="space-y-8">
                {/* Event Sistemi */}
                <section class="border-l-4 border-purple-500 pl-4">
                  <h3 class="text-lg font-bold text-purple-700 mb-3">🎯 Event Sistemi</h3>
                  <p class="text-gray-700 mb-4">
                    Script'ler otomatik olarak sistem eventlerine tepki verir. Her event için <code class="bg-gray-100 px-2 py-1 rounded">context</code> objesi ile event verilerine erişebilirsiniz.
                  </p>
                  
                  <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 class="font-semibold text-gray-800 mb-2">Mevcut Event'ler:</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div class="bg-white p-3 rounded border">
                        <code class="text-blue-600 font-semibold">onTaskComplete</code>
                        <p class="text-gray-600 mt-1">Görev tamamlandığında tetiklenir</p>
                        <p class="text-xs text-gray-500 mt-1">Data: task, completedAt</p>
                      </div>
                      <div class="bg-white p-3 rounded border">
                        <code class="text-blue-600 font-semibold">onTaskAdd</code>
                        <p class="text-gray-600 mt-1">Yeni görev eklendiğinde tetiklenir</p>
                        <p class="text-xs text-gray-500 mt-1">Data: task</p>
                      </div>
                      <div class="bg-white p-3 rounded border">
                        <code class="text-blue-600 font-semibold">onTaskRemove</code>
                        <p class="text-gray-600 mt-1">Görev silindiğinde tetiklenir</p>
                        <p class="text-xs text-gray-500 mt-1">Data: taskId, task</p>
                      </div>
                      <div class="bg-white p-3 rounded border">
                        <code class="text-blue-600 font-semibold">onInventoryAdd</code>
                        <p class="text-gray-600 mt-1">Envantere item eklendiğinde tetiklenir</p>
                        <p class="text-xs text-gray-500 mt-1">Data: itemName, amount, totalAmount</p>
                      </div>
                      <div class="bg-white p-3 rounded border">
                        <code class="text-blue-600 font-semibold">onRewardUse</code>
                        <p class="text-gray-600 mt-1">Ödül kullanıldığında tetiklenir</p>
                        <p class="text-xs text-gray-500 mt-1">Data: reward, context</p>
                      </div>
                      <div class="bg-white p-3 rounded border">
                        <code class="text-blue-600 font-semibold">onAchievementUnlock</code>
                        <p class="text-gray-600 mt-1">Başarı açıldığında tetiklenir</p>
                        <p class="text-xs text-gray-500 mt-1">Data: name, description</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-blue-50 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-800 mb-2">Örnek Event Kullanımı:</h4>
                    <pre class="bg-white p-3 rounded text-sm text-gray-800 overflow-x-auto">
{`// Event tipini kontrol et
if (context.event === 'onTaskComplete') {
  const completedTask = context.eventData.task;
  
  // Task priortesine göre bonus ver
  if (completedTask.priority === 'urgent') {
    x.inventory.addItem('bonus_coin', 50);
    x.ui.notify('🚨 Acil görev bonusu: +50 coin!');
  }
}

// Manuel event tetikleme
x.events.trigger('onCustomEvent', { 
  message: 'Özel event tetiklendi!' 
});`}
                    </pre>
                  </div>
                </section>

                {/* Tasks API */}
                <section class="border-l-4 border-green-500 pl-4">
                  <h3 class="text-lg font-bold text-green-700 mb-3">📋 Tasks API</h3>
                  <p class="text-gray-700 mb-4">
                    Görev yönetimi için kullanılan API fonksiyonları. Görev ekleme, silme, tamamlama işlemlerini yapar.
                  </p>

                  <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-green-600">x.tasks.getAllTasks()</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Tüm görevleri döndürür (tamamlanan ve tamamlanmayan).</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Dönüş:</strong> <code>Array&lt;Task&gt;</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`const allTasks = x.tasks.getAllTasks();
const completedTasks = allTasks.filter(t => t.completed);
console.log(\`Toplam \${completedTasks.length} görev tamamlandı\`);`}
                        </pre>
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-green-600">x.tasks.addTask(taskData)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Yeni görev ekler ve onTaskAdd eventini tetikler.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametre:</strong> <code>taskData: {`{name, description?, category?, priority?, points?}`}</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`x.tasks.addTask({
  name: 'Kitap oku',
  description: '30 sayfa okumayı hedefle',
  category: 'Eğitim',
  priority: 'normal',
  points: 25
});`}
                        </pre>
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-green-600">x.tasks.completeTask(taskId)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Görevi tamamlar ve onTaskComplete eventini tetikler.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametre:</strong> <code>taskId: string</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`// İlk tamamlanmamış görevi otomatik tamamla
const pendingTasks = x.tasks.getAllTasks().filter(t => !t.completed);
if (pendingTasks.length > 0) {
  x.tasks.completeTask(pendingTasks[0].id);
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Inventory API */}
                <section class="border-l-4 border-yellow-500 pl-4">
                  <h3 class="text-lg font-bold text-yellow-700 mb-3">📦 Inventory API</h3>
                  <p class="text-gray-700 mb-4">
                    Envanter yönetimi API'si. Coin, exp, item gibi kaynakları yönetir.
                  </p>

                  <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-yellow-600">x.inventory.addItem(itemName, amount)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Envantere item ekler ve onInventoryAdd eventini tetikler.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametreler:</strong> <code>itemName: string, amount: number</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`// Çeşitli itemler ekle
x.inventory.addItem('altın', 100);
x.inventory.addItem('exp', 50);
x.inventory.addItem('mana_potion', 1);

// Random item ver
const items = ['gem', 'scroll', 'potion'];
const randomItem = x.utils.getRandomChoice(items);
x.inventory.addItem(randomItem, 1);`}
                        </pre>
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-yellow-600">x.inventory.getTotal(itemName)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Belirtilen itemin toplam miktarını döndürür.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametre:</strong> <code>itemName: string</code><br/>
                        <strong>Dönüş:</strong> <code>number</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`const goldAmount = x.inventory.getTotal('altın');
if (goldAmount >= 1000) {
  x.achievements.unlock('zengin', '1000 altın biriktirdin!');
}

// Milestone kontrolleri
const expAmount = x.inventory.getTotal('exp');
if ([100, 500, 1000, 2500].includes(expAmount)) {
  x.ui.notify(\`🌟 \${expAmount} EXP milestone!\`);
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Achievements API */}
                <section class="border-l-4 border-red-500 pl-4">
                  <h3 class="text-lg font-bold text-red-700 mb-3">🏆 Achievements API</h3>
                  <p class="text-gray-700 mb-4">
                    Başarı sistemi API'si. Başarıları açma ve kontrol etme işlemleri.
                  </p>

                  <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-red-600">x.achievements.unlock(name, description)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Yeni başarı açar ve onAchievementUnlock eventini tetikler.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametreler:</strong> <code>name: string, description: string</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`// Basit başarı
x.achievements.unlock('ilk_görev', 'İlk görevini tamamladın!');

// Koşullu başarı
const completedCount = x.tasks.getAllTasks().filter(t => t.completed).length;
if (completedCount === 10) {
  x.achievements.unlock('görev_ustası', '10 görev tamamladın!');
  x.inventory.addItem('usta_madalyası', 1);
}

// Kategori bazlı başarı
if (context.event === 'onTaskComplete') {
  const task = context.eventData.task;
  if (task.category === 'Spor') {
    x.achievements.unlock('sporcu', 'İlk spor görevini tamamladın!');
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-red-600">x.achievements.isUnlocked(name)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Başarının açılıp açılmadığını kontrol eder.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametre:</strong> <code>name: string</code><br/>
                        <strong>Dönüş:</strong> <code>boolean</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`// Başarı kontrolü yaparak bonus ver
if (!x.achievements.isUnlocked('hızlı_başlangıç')) {
  const completedToday = x.tasks.getAllTasks()
    .filter(t => t.completed && isToday(t.completedAt));
  
  if (completedToday.length >= 3) {
    x.achievements.unlock('hızlı_başlangıç', 'Bugün 3 görev tamamladın!');
    x.inventory.addItem('bonus_exp', 100);
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* UI API */}
                <section class="border-l-4 border-blue-500 pl-4">
                  <h3 class="text-lg font-bold text-blue-700 mb-3">🎨 UI API</h3>
                  <p class="text-gray-700 mb-4">
                    Kullanıcı arayüzü etkileşimleri için API fonksiyonları.
                  </p>

                  <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">
                        <code class="text-blue-600">x.ui.notify(message)</code>
                      </h4>
                      <p class="text-gray-600 mb-2">Kullanıcıya bildirim gösterir.</p>
                      <div class="bg-white p-3 rounded text-sm">
                        <strong>Parametre:</strong> <code>message: string</code><br/>
                        <strong>Örnek:</strong>
                        <pre class="mt-2 text-xs text-gray-700">
{`// Basit bildirim
x.ui.notify('Tebrikler! Görevi tamamladın.');

// Emoji'li bildirimler
x.ui.notify('🎉 Harika iş! +50 exp kazandın!');
x.ui.notify('⚠️ Dikkat: Günlük limit aşıldı.');
x.ui.notify('🏆 Yeni başarı açıldı!');

// Dinamik bildirimler
const earnedPoints = task.points || 0;
x.ui.notify(\`✅ Görev tamamlandı! +\${earnedPoints} puan\`);`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Utils API */}
                <section class="border-l-4 border-indigo-500 pl-4">
                  <h3 class="text-lg font-bold text-indigo-700 mb-3">🛠️ Utils API</h3>
                  <p class="text-gray-700 mb-4">
                    Yardımcı fonksiyonlar ve araçlar.
                  </p>

                  <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">Rastgele Sayı ve Seçim</h4>
                      <div class="bg-white p-3 rounded text-sm space-y-2">
                        <p><code class="text-indigo-600">x.utils.getRandomInt(min, max)</code> - Min-max arası rastgele sayı</p>
                        <p><code class="text-indigo-600">x.utils.getRandomChoice(array)</code> - Array'den rastgele eleman</p>
                        <pre class="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
{`// Rastgele bonus
const bonusAmount = x.utils.getRandomInt(10, 100);
x.inventory.addItem('bonus_coin', bonusAmount);

// Rastgele ödül
const rewards = ['gem', 'potion', 'scroll', 'coin'];
const randomReward = x.utils.getRandomChoice(rewards);
x.inventory.addItem(randomReward, 1);

// Rastgele event
const events = ['lucky_day', 'double_exp', 'bonus_time'];
if (x.utils.getRandomInt(1, 100) <= 10) { // %10 şans
  const event = x.utils.getRandomChoice(events);
  x.events.trigger(event, {});
}`}
                        </pre>
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">Tarih ve Zaman</h4>
                      <div class="bg-white p-3 rounded text-sm space-y-2">
                        <p><code class="text-indigo-600">x.utils.getDaysAgo(days)</code> - X gün öncesinin tarihini döndürür</p>
                        <p><code class="text-indigo-600">x.utils.calculateStreak(tasks, days)</code> - Streak hesaplama</p>
                        <pre class="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
{`// Son 7 günün analiği
const weekAgo = x.utils.getDaysAgo(7);
const recentTasks = x.tasks.getAllTasks()
  .filter(t => t.completed && new Date(t.completedAt) > weekAgo);

console.log(\`Son 7 günde \${recentTasks.length} görev tamamlandı\`);

// Streak hesaplama
const streak = x.utils.calculateStreak(
  x.tasks.getAllTasks().filter(t => t.completed), 
  7
);

if (streak >= 7) {
  x.achievements.unlock('haftalık_streak', '7 gün üst üste görev tamamladın!');
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Gelişmiş Örnekler */}
                <section class="border-l-4 border-pink-500 pl-4">
                  <h3 class="text-lg font-bold text-pink-700 mb-3">🚀 Gelişmiş Script Örnekleri</h3>
                  <p class="text-gray-700 mb-4">
                    Karmaşık senaryolar için hazırlanmış örnek scriptler.
                  </p>

                  <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">🎯 Smart Task Analyzer</h4>
                      <div class="bg-white p-3 rounded text-sm">
                        <pre class="text-xs text-gray-700 whitespace-pre-wrap">
{`// Görev analizi ve akıllı öneriler
if (context.event === 'onTaskComplete') {
  const allTasks = x.tasks.getAllTasks().filter(t => t.completed);
  
  // Kategori performansı
  const categories = {};
  allTasks.forEach(task => {
    const cat = task.category || 'Genel';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  // En başarılı kategori
  const topCategory = Object.entries(categories)
    .sort(([,a], [,b]) => b - a)[0];
    
  if (topCategory && topCategory[1] >= 10) {
    x.achievements.unlock(\`\${topCategory[0]}_uzmanı\`, 
      \`\${topCategory[0]} kategorisinde uzmanlaştın!\`);
    x.inventory.addItem('uzmanlık_bonusu', 50);
  }
  
  // Haftalık trend analizi
  const thisWeek = x.utils.getDaysAgo(7);
  const weeklyTasks = allTasks.filter(t => 
    new Date(t.completedAt) > thisWeek
  );
  
  if (weeklyTasks.length >= 20) {
    x.ui.notify('🔥 Süper verimli hafta! Bonus kazandın!');
    x.inventory.addItem('verimlilik_bonusu', 100);
  }
}`}
                        </pre>
                      </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">🎮 Dynamic Challenge System</h4>
                      <div class="bg-white p-3 rounded text-sm">
                        <pre class="text-xs text-gray-700 whitespace-pre-wrap">
{`// Dinamik meydan okuma sistemi
if (context.event === 'onTaskComplete') {
  const completed = x.tasks.getAllTasks().filter(t => t.completed);
  const today = new Date().toDateString();
  const todayTasks = completed.filter(t => 
    new Date(t.completedAt).toDateString() === today
  );
  
  // Günlük challenge'lar
  const challenges = [
    { id: 'speed_demon', target: 5, reward: 'hız_madalyası', 
      message: '5 görev tamamla (Hız Şeytanı)' },
    { id: 'category_master', target: 3, reward: 'kategori_uzmanı',
      message: 'Aynı kategoride 3 görev tamamla' },
    { id: 'priority_hunter', target: 2, reward: 'öncelik_avcısı',
      message: '2 yüksek öncelikli görev tamamla' }
  ];
  
  challenges.forEach(challenge => {
    if (!x.achievements.isUnlocked(challenge.id)) {
      let progress = 0;
      
      switch(challenge.id) {
        case 'speed_demon':
          progress = todayTasks.length;
          break;
        case 'category_master':
          const catGroups = {};
          todayTasks.forEach(t => {
            const cat = t.category || 'Genel';
            catGroups[cat] = (catGroups[cat] || 0) + 1;
          });
          progress = Math.max(...Object.values(catGroups));
          break;
        case 'priority_hunter':
          progress = todayTasks.filter(t => 
            t.priority === 'high' || t.priority === 'urgent'
          ).length;
          break;
      }
      
      if (progress >= challenge.target) {
        x.achievements.unlock(challenge.id, challenge.message);
        x.inventory.addItem(challenge.reward, 1);
        x.ui.notify(\`🏆 Challenge tamamlandı: \${challenge.message}\`);
      }
    }
  });
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
