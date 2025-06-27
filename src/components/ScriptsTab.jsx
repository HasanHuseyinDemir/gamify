import { For, Show, createSignal, createMemo } from 'solid-js'

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

  // Script şablonları
  const scriptTemplates = [
    {
      name: "🎮 Master Event Handler",
      description: "Tüm eventleri dinleyen ve akıllı tepkiler veren kapsamlı script",
      code: `// 🎮 MASTER EVENT HANDLER - Tüm eventleri akıllı şekilde yönetir

console.log("🎯 Event:", context.event, "Data:", context.eventData);

switch(context.event) {
  case 'onTaskComplete':
    // Görev tamamlama bonusları
    const priorityBonuses = {
      'urgent': { coins: 100, exp: 50, message: '🚨 Acil görev bonusu!' },
      'high': { coins: 50, exp: 30, message: '⚡ Yüksek öncelik bonusu!' },
      'normal': { coins: 20, exp: 15, message: '✅ Görev bonusu!' },
      'low': { coins: 10, exp: 10, message: '📝 Basit görev bonusu!' }
    };
    
    const bonus = priorityBonuses[task.priority] || priorityBonuses['normal'];
    x.inventory.addItem('altın', bonus.coins);
    x.inventory.addItem('exp', bonus.exp);
    x.ui.notify(bonus.message + \` +\${bonus.coins} altın, +\${bonus.exp} exp\`);
    break;
    
  case 'onTaskAdd':
    x.ui.notify("➕ Yeni görev planlandı: " + context.eventData.task.name);
    break;
    
  case 'onInventoryAdd':
    const { itemName, amount, totalAmount } = context.eventData;
    if ([10, 25, 50, 100].includes(totalAmount)) {
      x.achievements.unlock(\`\${itemName}_collector_\${totalAmount}\`, \`\${itemName} milestone!\`);
    }
    break;
    
  default:
    x.ui.log("Event: " + context.event);
}`
    },
    {
      name: "📊 Analytics Engine",
      description: "Gelişmiş analitik ve verimlilik takibi",
      code: `// 📊 ANALYTICS ENGINE

if (context.event === 'onTaskComplete') {
  const allTasks = x.tasks.getAllTasks().filter(t => t.completed);
  const last7Days = x.utils.getDaysAgo(7);
  const recentTasks = allTasks.filter(t => new Date(t.completedAt) > last7Days);
  
  // Kategori dağılımı
  const categoryStats = {};
  recentTasks.forEach(t => {
    const cat = t.category || 'Genel';
    categoryStats[cat] = (categoryStats[cat] || 0) + 1;
  });
  
  const topCategory = Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0];
  
  if (topCategory && topCategory[1] >= 5) {
    x.ui.notify(\`📊 En verimli kategorin: \${topCategory[0]} (\${topCategory[1]} görev)\`);
    x.inventory.addItem('analytics_bonusu', 20);
  }
  
  // Haftalık rapor
  if (recentTasks.length % 7 === 0) {
    x.ui.notify("� Haftalık Analitik Raporu hazırlandı!");
    x.logs.addLog({
      name: 'Haftalık Rapor',
      description: \`\${recentTasks.length} görev tamamlandı\`,
      points: { analytics: 1 }
    });
  }
}`
    },
    {
      name: "🎲 Challenge Generator",
      description: "Dinamik meydan okuma sistemi",
      code: `// 🎲 CHALLENGE GENERATOR

if (context.event === 'onTaskComplete') {
  const random = x.utils.getRandomInt(1, 100);
  
  if (random <= 25) {
    const challenges = [
      { name: "Çifte Tempo", desc: "Bugün 2 görev daha", reward: "tempo_bonusu" },
      { name: "Kategori Master", desc: \`\${task.category} kategorisinde 3 görev\`, reward: "master_rozeti" },
      { name: "Erken Kuş", desc: "Yarın sabah erken bir görev", reward: "erken_bonusu" }
    ];
    
    const challenge = x.utils.getRandomChoice(challenges);
    
    x.ui.notify(\`🎯 YENİ CHALLENGE: \${challenge.name}\\n\${challenge.desc}\\n🎁 Ödül: \${challenge.reward}\`);
    
    x.logs.addLog({
      name: "Meydan Okuma",
      description: \`\${challenge.name}: \${challenge.desc}\`,
      points: { challenge: 1 }
    });
  }
}`
    },
    {
      name: "⚡ Smart Rewards",
      description: "Akıllı ödül ve bonus sistemi",
      code: `// ⚡ SMART REWARDS

switch(context.event) {
  case 'onTaskComplete':
    const hour = new Date().getHours();
    
    // Zaman bonusu
    if (hour >= 6 && hour <= 9) {
      x.inventory.addItem('erken_bonus', 15);
      x.ui.notify('� Erken saatte tamamlama bonusu!');
    }
    
    // Streak bonusu
    const todayTasks = x.tasks.getAllTasks()
      .filter(t => t.completed && 
        new Date(t.completedAt).toDateString() === new Date().toDateString()
      ).length;
      
    if (todayTasks >= 5) {
      x.inventory.addItem('streak_bonusu', 30);
      x.ui.notify(\`🔥 Günlük 5 görev streaki! +30 bonus\`);
    }
    break;
    
  case 'onInventoryAdd':
    // Koleksiyon bonusu
    const totalItems = x.inventory.getAllItems()
      .reduce((sum, item) => sum + item.amount, 0);
      
    if (totalItems % 100 === 0) {
      x.ui.notify(\`🗂️ \${totalItems} item milestone!\`);
      x.inventory.addItem('koleksiyon_bonusu', 50);
    }
    break;
}`
    },
    {
      name: "🌟 Achievement Factory",
      description: "Dinamik başarı üretici",
      code: `// 🌟 ACHIEVEMENT FACTORY

if (context.event === 'onTaskComplete') {
  const allTasks = x.tasks.getAllTasks().filter(t => t.completed);
  const totalCompleted = allTasks.length;
  
  // Milestone başarıları
  const milestones = [1, 5, 10, 25, 50, 100, 250, 500];
  if (milestones.includes(totalCompleted)) {
    const tier = totalCompleted >= 100 ? 'MASTER' : 
                 totalCompleted >= 25 ? 'EXPERT' : 'NOVICE';
    
    x.achievements.unlock(\`gorev_\${tier.toLowerCase()}_\${totalCompleted}\`, 
      \`\${totalCompleted} görev - \${tier} seviyesi!\`);
    
    x.inventory.addItem('başarı_puanı', totalCompleted * 2);
    x.ui.notify(\`🏆 \${tier}: \${totalCompleted} GÖREV! Başarı puanı kazandın!\`);
  }
  
  // Kategori uzmanı
  if (task.category) {
    const categoryTasks = allTasks.filter(t => t.category === task.category).length;
    
    if ([3, 10, 25].includes(categoryTasks)) {
      x.achievements.unlock(\`\${task.category}_uzmanı_\${categoryTasks}\`, 
        \`\${task.category} kategorisinde \${categoryTasks} görev!\`);
      x.ui.notify(\`🎯 \${task.category} uzmanı oluyorsun!\`);
    }
  }
}`
    },
    {
      name: "🔮 Predictive System",
      description: "Öngörülü sistem ve pattern analizi",
      code: `// 🔮 PREDICTIVE SYSTEM

if (context.event === 'onTaskComplete') {
  const allTasks = x.tasks.getAllTasks().filter(t => t.completed);
  const recentTasks = allTasks.slice(-10); // Son 10 görev
  
  // Pattern analizi
  const patterns = {
    morningTasks: 0,
    eveningTasks: 0,
    weekendTasks: 0,
    favoriteCategory: null
  };
  
  recentTasks.forEach(task => {
    const hour = new Date(task.completedAt).getHours();
    const day = new Date(task.completedAt).getDay();
    
    if (hour >= 6 && hour <= 12) patterns.morningTasks++;
    if (hour >= 18 && hour <= 23) patterns.eveningTasks++;
    if (day === 0 || day === 6) patterns.weekendTasks++;
  });
  
  // Tahmin ve öneriler
  if (patterns.morningTasks >= 7) {
    x.ui.notify("🌅 Sabah kişisisin! Zor görevleri sabaha planla.");
    x.inventory.addItem('sabah_ustası_bonusu', 25);
  }
  
  if (patterns.weekendTasks >= 3) {
    x.ui.notify("🏋️ Hafta sonu aktifsin! Özel weekend bonusu!");
    x.inventory.addItem('weekend_warrior', 40);
  }
}`
    }
  ]
  
  // Belirli itemlerde milestone bonusları
  if (itemName === 'altın' && total >= 100) {
    x.achievements.unlock('altin_koleksiyoncusu', 'İlk 100 altına ulaştın!');
    x.ui.notify('🏆 Altın Koleksiyoncusu başarısı açıldı!');
  }
  
  if (itemName === 'elmas' && total >= 10) {
    x.achievements.unlock('elmas_avcisi', 'İlk 10 elmasına ulaştın!');
    x.inventory.addItem('özel_sandık', 1);
    x.ui.notify('💎 Elmas Avcısı! Özel sandık kazandın!');
  }
  
  // Genel toplama bonusu
  if (total % 50 === 0) {
    x.ui.notify(\`🎯 \${itemName} milestone: \${total} adet!\`);
    x.inventory.addItem('milestone_bonusu', 1);
  }
}`
    },
    {
      name: "Task Achievement Engine",
      description: "Görev bazlı başarı sistemi",
      code: `// Görev eventlerini dinle
if (context.event === 'onTaskComplete') {
  const completedTask = task;
  
  // Kategori bazlı başarılar
  const categoryCount = x.tasks.getAllTasks()
    .filter(t => t.completed && t.category === completedTask.category).length;
    
  if (categoryCount === 5) {
    x.achievements.unlock(completedTask.category + '_novice', \`\${completedTask.category} kategorisinde 5 görev tamamladın!\`);
  } else if (categoryCount === 25) {
    x.achievements.unlock(completedTask.category + '_expert', \`\${completedTask.category} kategorisinde 25 görev tamamladın!\`);
    x.inventory.addItem('uzman_rozeti', 1);
  }
  
  // Öncelik bazlı başarılar
  if (completedTask.priority === 'urgent') {
    const urgentCount = x.tasks.getAllTasks()
      .filter(t => t.completed && t.priority === 'urgent').length;
    
    if (urgentCount === 10) {
      x.achievements.unlock('acil_durum_uzmanı', '10 acil görev tamamladın!');
      x.inventory.addItem('acil_madalyası', 1);
    }
  }
  
  // Toplam görev sayısı milestones
  const totalCompleted = x.tasks.getAllTasks().filter(t => t.completed).length;
  
  if ([10, 50, 100, 250, 500, 1000].includes(totalCompleted)) {
    x.achievements.unlock(\`gorev_master_\${totalCompleted}\`, \`\${totalCompleted} görev tamamladın!\`);
    x.inventory.addItem('başarı_puanı', totalCompleted / 10);
    x.ui.notify(\`🏆 \${totalCompleted} Görev Master! +\${totalCompleted/10} başarı puanı!\`);
  }
}`
    },
    {
      name: "Smart Reward System",
      description: "Akıllı ödül ve bonus sistemi",
      code: `// Event tipine göre ödüller
switch(context.event) {
  case 'onTaskComplete':
    // Zaman bazlı bonuslar
    const hour = new Date().getHours();
    if (hour >= 5 && hour <= 9) {
      x.inventory.addItem('erken_kuş_bonusu', 2);
      x.ui.notify('🌅 Erken Kuş Bonusu! +2 bonus');
    }
    
    // Streak hesapla
    const today = x.utils.getCurrentDate();
    const streak = x.utils.calculateStreak(x.tasks.getAllTasks().filter(t => t.completed), 1);
    
    if (streak >= 5) {
      x.inventory.addItem('günlük_streak', streak);
      x.ui.notify(\`🔥 \${streak} günlük streak! +\${streak} streak bonusu\`);
    }
    break;
    
  case 'onRewardUse':
    const reward = context.eventData.reward;
    x.ui.notify(\`🎁 \${reward.name} ödülü kullanıldı!\`);
    
    // Ödül kullanım istatistikleri
    x.logs.addLog({
      name: 'Ödül Kullanımı',
      description: \`\${reward.name} ödülü kullanıldı\`,
      points: { ödül_kullanımı: 1 }
    });
    break;
    
  case 'onInventoryAdd':
    // Envanter doluluğuna göre uyarılar
    const totalItems = x.inventory.getAllItems()
      .reduce((sum, item) => sum + item.amount, 0);
      
    if (totalItems >= 1000) {
      x.ui.notify('⚠️ Envanteriniz doluyor! Eşyaları kullanmayı düşünün.');
    }
    break;
}`
    },
    {
      name: "Productivity Analytics",
      description: "Verimlilik analizi ve öneriler",
      code: `// Sadece görev completion eventlerinde
if (context.event === 'onTaskComplete') {
  const allTasks = x.tasks.getAllTasks().filter(t => t.completed);
  const last7Days = x.utils.getDaysAgo(7);
  const recentTasks = allTasks.filter(t => new Date(t.completedAt) > last7Days);
  
  // Haftalık analiz
  const weeklyStats = {
    total: recentTasks.length,
    categories: {},
    priorities: {},
    avgPerDay: recentTasks.length / 7
  };
  
  recentTasks.forEach(t => {
    weeklyStats.categories[t.category] = (weeklyStats.categories[t.category] || 0) + 1;
    weeklyStats.priorities[t.priority] = (weeklyStats.priorities[t.priority] || 0) + 1;
  });
  
  // En verimli kategori
  const topCategory = Object.entries(weeklyStats.categories)
    .sort(([,a], [,b]) => b - a)[0];
    
  if (topCategory && topCategory[1] >= 5) {
    x.ui.notify(\`📊 Bu hafta en verimli olduğunuz kategori: \${topCategory[0]} (\${topCategory[1]} görev)\`);
    x.inventory.addItem(\`\${topCategory[0]}_uzmanı\`, 1);
  }
  
  // Verimlilik önerileri
  if (weeklyStats.avgPerDay < 1) {
    x.ui.notify('💡 Öneri: Günde en az 1 görev tamamlamaya çalışın!');
  } else if (weeklyStats.avgPerDay >= 5) {
    x.ui.notify('🚀 Harika! Süper verimli bir haftanız var!');
    x.inventory.addItem('verimlilik_madalyası', 1);
  }
  
  // Her 7. görevde analiz raporu
  if (recentTasks.length % 7 === 0) {
    x.ui.log('📈 Haftalık Rapor: ' + JSON.stringify(weeklyStats, null, 2));
  }
}`
    },
    {
      name: "Dynamic Challenge Creator",
      description: "Dinamik görev oluşturucu ve meydan okumalar",
      code: `// Belirli eventlerde yeni görevler öner
if (context.event === 'onTaskComplete') {
  const completedTask = task;
  const random = x.utils.getRandomInt(1, 100);
  
  // %20 şansla challenge öner
  if (random <= 20) {
    const challenges = [
      { name: 'Çifte Tempo', desc: 'Bugün 2 görev daha tamamla', reward: 'tempo_bonusu' },
      { name: 'Kategori Kral', desc: \`\${completedTask.category} kategorisinde 3 görev daha\`, reward: 'kategori_uzmanı' },
      { name: 'Yüksek Öncelik', desc: 'Bir yüksek öncelikli görev tamamla', reward: 'öncelik_madalyası' },
      { name: 'Erken Kuş', desc: 'Yarın sabah 9 öncesi bir görev tamamla', reward: 'erken_bonusu' }
    ];
    
    const challenge = x.utils.getRandomChoice(challenges);
    
    x.ui.notify(\`🎯 Yeni Meydan Okuma: \${challenge.name}\\n\${challenge.desc}\\nÖdül: \${challenge.reward}\`);
    
    // Challenge'ı log olarak kaydet
    x.logs.addLog({
      name: 'Meydan Okuma',
      description: \`\${challenge.name}: \${challenge.desc}\`,
      points: { challenge: 1 }
    });
  }
}

// Inventory eventlerinde koleksiyon önerileri
if (context.event === 'onInventoryAdd') {
  const itemName = context.eventData.itemName;
  const collections = {
    'altın': ['gümüş', 'bronz', 'elmas'],
    'elmas': ['safir', 'yakut', 'zümrüt'],
    'kitap': ['kalem', 'defter', 'silgi']
  };
  
  if (collections[itemName]) {
    const suggestion = x.utils.getRandomChoice(collections[itemName]);
    x.ui.notify(\`� Koleksiyon Önerisi: \${suggestion} toplamayı deneyin!\`);
  }
}`
    }
  ]

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
              <For each={scriptTemplates}>{template => (
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
          <Show when={isEditing()} fallback={
            <div class="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              <div class="text-4xl mb-4">✨</div>
              <p class="text-lg">Script seçin veya yeni oluşturun</p>
              <p class="text-sm mt-2">Sol taraftan bir script seçerek düzenlemeye başlayın</p>
            </div>
          }>
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
          </Show>
        </div>
      </div>
    </div>
  )
}
