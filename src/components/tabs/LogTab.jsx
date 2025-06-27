import { For, Show } from 'solid-js'

export default function LogTab(props) {
  const {
    actions, deleteAction, editId, setEditId, editName, setEditName,
    editDescription, setEditDescription, editPoints, setEditPoints,
    startEdit, saveEdit
  } = props

  return (
    <div class="space-y-4 sm:space-y-6">
      {/* Başlık */}
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2">📋 Eylem Logları</h2>
        <p class="text-gray-600 text-sm sm:text-base">
          Gerçekleştirdiğiniz tüm eylemlerin kaydı burada tutulur. Bu sistem sadece kayıt tutar, görev yönetimi için "Görevler" sekmesini kullanın.
        </p>
      </div>

      {/* Mevcut Loglar */}
      <div class="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
        <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
          📝 Eylem Geçmişi ({actions().length} kayıt)
        </h3>
        
        <Show when={actions().length === 0}>
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📭</div>
            <p>Henüz hiç eylem kaydı yok.</p>
            <p class="text-sm mt-1">Görevler sekmesinden eylem ekleyebilirsiniz.</p>
          </div>
        </Show>

        <div class="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
          <For each={actions().slice().reverse()}>
            {(action) => (
              <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                <Show when={editId() === action.id}>
                  {/* Düzenleme Formu */}
                  <form onSubmit={saveEdit} class="space-y-3">
                    <input
                      type="text"
                      value={editName()}
                      onInput={(e) => setEditName(e.target.value)}
                      placeholder="Eylem adı"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <textarea
                      value={editDescription()}
                      onInput={(e) => setEditDescription(e.target.value)}
                      placeholder="Açıklama (opsiyonel)"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      rows="2"
                    />
                    <input
                      type="text"
                      value={editPoints()}
                      onInput={(e) => setEditPoints(e.target.value)}
                      placeholder="Puanlar (ör: temizlik:10, egzersiz:15)"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                    <div class="flex gap-2">
                      <button
                        type="submit"
                        class="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        ✅ Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        class="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        ❌ İptal
                      </button>
                    </div>
                  </form>
                </Show>

                <Show when={editId() !== action.id}>
                  {/* Normal Görünüm */}
                  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-gray-800 text-sm sm:text-base truncate">
                        {action.name}
                      </h4>
                      <Show when={action.description}>
                        <p class="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">
                          {action.description}
                        </p>
                      </Show>
                      <div class="flex flex-wrap gap-1 mt-2">
                        <For each={Object.entries(action.points || {})}>
                          {([attr, pts]) => (
                            <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                              pts > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attr}: {pts > 0 ? '+' : ''}{pts}
                            </span>
                          )}
                        </For>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        {new Date(action.date).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div class="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(action)}
                        class="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => deleteAction(action.id)}
                        class="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs sm:text-sm"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Bilgi Notu */}
      <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 class="font-semibold text-blue-800 mb-2">💡 Log Sistemi Hakkında</h4>
        <ul class="text-blue-700 text-sm space-y-1">
          <li>• Bu sekme sadece geçmiş eylemlerin kaydını tutar</li>
          <li>• Yeni eylem eklemek için "Görevler" sekmesini kullanın</li>
          <li>• Burada kayıtları düzenleyebilir veya silebilirsiniz</li>
          <li>• Tüm kayıtlar otomatik olarak tarih sırasına göre listelenir</li>
        </ul>
      </div>
    </div>
  )
}
