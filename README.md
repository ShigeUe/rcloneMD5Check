# rcloneでFTPを使う時のヘルパー

rcloneでftpを使ってmd5sumを取り、ローカルとftp側で同期しやすいようにします。

rcloneはできればリモートシステムのmd5sumを取ろうとしますが、ftpでは対応していないシステムが多いようです。  
それで `rclone md5sum --download` コマンドを使いリモートのmd5sumを取りローカルと突合します。  
その結果をstdoutに出力することでrcloneに渡すことができ、変更のあるファイルだけを同期することができます。

ファイルをすべてダウンロードしてmd5sumを作るので効率が悪いように思いますが、`--size-only`だと検出できない変更も検出できますし、不要なファイルをアップロードしないのでタイムスタンプの変更もありません。

## 使い方

リポジトリをclone後、ソースファイルのあるディレクトリに移動します。    
`deno compile --allow-run rcloneMD5Check.ts` でコンパイルできます。  
パスの通ったディレクトリにコピーしてください。  
（rcloneもパスを通しておく必要があります）

`rcloneMD5Check.exe <local-path> <remote-path>` の形式で利用します。  
`remote-path` はrcloneの `リモート名:絶対パス` の形式になります。

一例としてブログのアップロードに使用しているコマンドは

```powershell
rcloneMD5Check.exe ./public/ eicon:/home/eicon/www/ | rclone sync ./public/ eicon:/home/eicon/www/ --files-from -
```

になります。  
最後の `-` は標準入力から読み取りなので省略しないでください。

`--dry-run` を付けてチェックすることを忘れないようにしてください。