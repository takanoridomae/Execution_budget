import { useState, useEffect, useCallback } from 'react';

interface IPInfo {
  local: string[];
  public: string | null;
  loading: boolean;
  error: string | null;
}

export const useIPAddress = () => {
  const [ipInfo, setIpInfo] = useState<IPInfo>({
    local: [],
    public: null,
    loading: true,
    error: null
  });

  // プライベートIPアドレスかどうかを判定（最初に定義）
  const isPrivateIP = useCallback((ip: string): boolean => {
    // IPアドレスの正規表現でチェック
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipRegex);
    
    if (!match) return false;
    
    const parts = match.slice(1).map(Number);
    
    // 有効なIPアドレスの範囲をチェック
    if (parts.some(part => part < 0 || part > 255)) return false;

    // RFC 1918 プライベートアドレス範囲
    return (
      // 10.0.0.0/8
      parts[0] === 10 ||
      // 172.16.0.0/12
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      // 192.168.0.0/16
      (parts[0] === 192 && parts[1] === 168) ||
      // リンクローカル 169.254.0.0/16
      (parts[0] === 169 && parts[1] === 254)
    );
  }, []);

  // WebRTC APIを使用してローカルIPアドレスを取得（デバッグ強化版）
  const getLocalIPsViaWebRTC = useCallback(async (): Promise<string[]> => {
    console.log('🔍 WebRTC IP検出を開始...');
    
    // WebRTCサポートチェック
    if (!window.RTCPeerConnection) {
      console.error('❌ WebRTC (RTCPeerConnection) がサポートされていません');
      return [];
    }

    // HTTPSチェック（一部ブラウザではHTTPSが必要）
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('⚠️ HTTPSではありません。一部ブラウザではWebRTCが制限される可能性があります');
    }

    return new Promise((resolve) => {
      const ips: string[] = [];
      let candidateCount = 0;
      let hasReceivedAnyCandidate = false;
      
      try {
        // シンプルな設定から開始（互換性を重視）
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });

        pc.onicecandidate = (event) => {
          console.log('📡 ICE candidate event:', event);
          
          if (event.candidate) {
            hasReceivedAnyCandidate = true;
            candidateCount++;
            const candidate = event.candidate.candidate;
            console.log(`🔍 ICE candidate ${candidateCount}:`, candidate);
            
            // IPv4アドレスを抽出
            const ipv4Match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
            if (ipv4Match) {
              const ip = ipv4Match[1];
              console.log(`🎯 IPv4アドレス発見: ${ip}`);
              
              if (!ips.includes(ip) && ip !== '0.0.0.0') {
                const isPrivate = isPrivateIP(ip);
                const isLocalhost = ip === '127.0.0.1';
                const isLinkLocal = ip.startsWith('169.254.');
                
                console.log(`📊 IP分析: ${ip} - プライベート:${isPrivate}, ローカルホスト:${isLocalhost}, リンクローカル:${isLinkLocal}`);
                
                if (isPrivate || isLocalhost || isLinkLocal) {
                  ips.push(ip);
                  console.log(`✅ IPv4を追加: ${ip} (合計: ${ips.length})`);
                } else {
                  console.log(`❌ IPv4をスキップ: ${ip} (パブリックIP)`);
                }
              }
            }
            
            // IPv6アドレスからIPv4ネットワークを推測
            const ipv6Match = candidate.match(/([0-9a-f:]+)/i);
            if (ipv6Match && ipv6Match[1].includes(':')) {
              const ipv6 = ipv6Match[1];
              console.log(`🌐 IPv6アドレス発見: ${ipv6}`);
              
              // IPv6からIPv4範囲を推測（非同期で実行）
              setTimeout(async () => {
                try {
                  await tryGuessIPv4FromEnvironment();
                } catch (error) {
                  console.warn('IPv6からのIPv4推測でエラー:', error);
                }
              }, 50);
            }
            
            // .localアドレスが見つかった場合は実際のIPを探す
            if (candidate.includes('.local')) {
              console.log(`🏠 mDNSローカルアドレス検出: ネットワーク探査を実行`);
              setTimeout(async () => {
                try {
                  const guessedIPs = await aggressiveLocalIPScan();
                  guessedIPs.forEach(guessedIP => {
                    if (!ips.includes(guessedIP)) {
                      ips.push(guessedIP);
                      console.log(`✅ 推測でIPを追加: ${guessedIP}`);
                    }
                  });
                } catch (error) {
                  console.warn('積極的IPスキャンでエラー:', error);
                }
              }, 100);
            }
            
            if (!ipv4Match && !ipv6Match) {
              console.log('🔍 候補にIPアドレスが見つかりません:', candidate);
            }
          } else {
            console.log('🏁 ICE candidate gathering 完了');
          }
        };

        pc.onicegatheringstatechange = () => {
          console.log('🔄 ICE gathering state:', pc.iceGatheringState);
          if (pc.iceGatheringState === 'complete') {
            console.log('✅ ICE gathering完了, 発見されたIP:', ips);
            cleanup();
            resolve(ips);
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('🔗 ICE connection state:', pc.iceConnectionState);
        };

        let gatheringTimeout: NodeJS.Timeout;
        const cleanup = () => {
          clearTimeout(gatheringTimeout);
          try {
            pc.close();
          } catch (e) {
            console.warn('WebRTC cleanup警告:', e);
          }
        };

        // タイムアウト設定
        gatheringTimeout = setTimeout(() => {
          console.log(`⏰ WebRTC タイムアウト (${hasReceivedAnyCandidate ? '候補あり' : '候補なし'}), 発見されたIP:`, ips);
          
          // 候補が全く取得できなかった場合の追加ログ
          if (!hasReceivedAnyCandidate) {
            console.error('❌ ICE候補が全く取得できませんでした。原因:');
            console.error('  - ファイアウォールがSTUNサーバーをブロック');
            console.error('  - ネットワーク設定の問題');
            console.error('  - ブラウザのWebRTC設定が無効');
            console.error('  - プライバシー設定でWebRTCが制限');
          }
          
          cleanup();
          resolve(ips);
        }, 8000);

        // データチャネルを作成してICE収集を開始
        console.log('📡 データチャネル作成中...');
        pc.createDataChannel('test', { ordered: true });

        // Offer作成
        console.log('📝 WebRTC Offer作成中...');
        pc.createOffer()
          .then(offer => {
            console.log('📄 Offer作成成功, ローカル記述設定中...');
            return pc.setLocalDescription(offer);
          })
          .then(() => {
            console.log('✅ ローカル記述設定完了, ICE候補収集開始...');
          })
          .catch((error) => {
            console.error('❌ WebRTC Offer作成/設定失敗:', error);
            cleanup();
            resolve(ips);
          });

      } catch (error) {
        console.error('❌ WebRTC初期化エラー:', error);
        resolve([]);
      }
    });
  }, [isPrivateIP]);

  // Network Information APIを使用
  const getLocalIPsViaNetworkAPI = useCallback(async (): Promise<string[]> => {
    const ips: string[] = [];
    
    // navigator.connectionが利用可能かチェック
    if ('connection' in navigator) {
      try {
        const connection = (navigator as any).connection;
        console.log('Network connection info:', connection); // デバッグ用
        
        if (connection && connection.effectiveType) {
          // ネットワーク接続があることを確認
          console.log('Network detected, trying common IPs');
        }
      } catch (error) {
        console.warn('Network Information API使用時エラー:', error);
      }
    }
    
    return ips;
  }, []);

  // 代替方法によるローカルIP検出（WebRTCフォールバック）
  const getCommonLocalIPs = useCallback(async (): Promise<string[]> => {
    console.log('🔍 代替IP検出方法を開始...');
    const validIPs: string[] = [];
    
    // 現在のページのホストからIPを推測
    try {
      const currentHost = window.location.hostname;
      console.log('🌐 現在のホスト名:', currentHost);
      
      if (currentHost && currentHost !== 'localhost' && isPrivateIP(currentHost)) {
        validIPs.push(currentHost);
        console.log('✅ 現在のホストIPを追加:', currentHost);
      }
    } catch (error) {
      console.warn('⚠️ 現在のホストからのIP推測に失敗:', error);
    }

    // より直接的なIP検出方法を試行
    try {
      console.log('🔍 直接的なIP検出を試行中...');
      const directIP = await getDirectLocalIP();
      if (directIP && isPrivateIP(directIP) && !validIPs.includes(directIP)) {
        validIPs.push(directIP);
        console.log('✅ 直接検出でIPを追加:', directIP);
      }
    } catch (error) {
      console.warn('⚠️ 直接IP検出に失敗:', error);
    }

    // 一般的なネットワーク範囲を効率的にテスト（実際の範囲を最優先）
    const commonRanges = [
      '192.168.1', '192.168.0', '192.168.2', '192.168.100',
      '10.0.0', '10.0.1', '10.1.1',
      '172.16.0', '172.20.0'
    ];

    console.log('🔍 ネットワーク範囲スキャンを開始...');
    for (const range of commonRanges) {
      try {
        // 各範囲で一般的なIPアドレスを動的にテスト（94番台のDHCP範囲を重点的に含む）
        const commonIPs = [
          `${range}.2`, `${range}.3`, `${range}.4`, `${range}.5`, `${range}.6`, `${range}.10`, 
          `${range}.20`, `${range}.25`, `${range}.30`, `${range}.50`,
          `${range}.90`, `${range}.91`, `${range}.92`, `${range}.93`, `${range}.94`, `${range}.95`,
          `${range}.96`, `${range}.97`, `${range}.98`, `${range}.99`,
          `${range}.100`, `${range}.101`, `${range}.102`, `${range}.103`, `${range}.104`, `${range}.105`,
          `${range}.150`, `${range}.200`, `${range}.250`
        ];
        
        for (const testIP of commonIPs) {
          try {
            const isActive = await testIPConnection(testIP, 50); // 短いタイムアウト
            if (isActive && !validIPs.includes(testIP)) {
              validIPs.push(testIP);
              console.log('✅ アクティブIPを発見:', testIP);
              // 最初のアクティブIPが見つかったら、そのサブネット内をより詳しく調べる
              const moreIPs = await quickScanSubnet(range);
              moreIPs.forEach(ip => {
                if (!validIPs.includes(ip)) {
                  validIPs.push(ip);
                }
              });
              break; // このレンジは完了
            }
          } catch (error) {
            // 接続エラーは正常
          }
        }
        
        // 何かIPが見つかったら他のレンジはスキップ
        if (validIPs.length > 1) { // localhost以外が見つかった場合
          break;
        }
      } catch (error) {
        console.warn(`⚠️ レンジ ${range} のスキャンに失敗:`, error);
      }
    }

    // 最低限ローカルホストは追加
    if (!validIPs.includes('127.0.0.1')) {
      validIPs.push('127.0.0.1');
    }

    console.log('🏁 代替IP検出完了:', validIPs);
    return Array.from(new Set(validIPs));
  }, [isPrivateIP]);

  // IP接続テスト関数
  const testIPConnection = async (ip: string, timeout: number = 200): Promise<boolean> => {
    try {
      // 簡単な接続テスト - 短いタイムアウトで
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      await fetch(`http://${ip}:80`, {
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // 接続エラーは期待される動作
      return false;
    }
  };

  // サブネット内のアクティブなIPアドレスをスキャン
  const scanSubnetForActiveIPs = async (subnet: string): Promise<string[]> => {
    const activeIPs: string[] = [];
    const promises: Promise<void>[] = [];
    
    // 一般的なホストIPをテスト（2-50の範囲で効率的にスキャン）
    const commonHostIPs = [
      2, 3, 4, 5, 10, 11, 12, 20, 21, 22, 25, 30, 50, 
      100, 101, 102, 110, 111, 150, 200, 250
    ];
    
    for (const hostNum of commonHostIPs) {
      const testIP = `${subnet}.${hostNum}`;
      
      promises.push(
        testIPConnection(testIP, 100).then(isActive => {
          if (isActive && isPrivateIP(testIP)) {
            activeIPs.push(testIP);
            console.log(`Found active IP in subnet: ${testIP}`);
          }
        }).catch(() => {
          // エラーは無視
        })
      );
      
      // 同時接続数を制限
      if (promises.length >= 10) {
        await Promise.allSettled(promises);
        promises.length = 0;
      }
    }
    
    // 残りの処理を完了
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    return activeIPs;
  };

  // 直接的なIP検出方法（新しいWebRTCアプローチ）
  const getDirectLocalIP = async (): Promise<string | null> => {
    try {
      console.log('🔍 直接WebRTC検出を開始...');
      
      // より単純なWebRTC設定
      const pc = new RTCPeerConnection();
      
      return new Promise((resolve) => {
        let resolved = false;
        let foundIP: string | null = null;
        
        pc.onicecandidate = (event) => {
          if (event.candidate && !resolved) {
            const candidate = event.candidate.candidate;
            console.log('🔍 直接検出候補:', candidate);
            
            // host候補のみを探す（よりローカルなIP）
            if (candidate.includes('typ host')) {
              const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
              if (ipMatch) {
                const ip = ipMatch[1];
                if (isPrivateIP(ip) && ip !== '127.0.0.1') {
                  console.log('✅ 直接検出でプライベートIPを発見:', ip);
                  foundIP = ip;
                  resolved = true;
                  pc.close();
                  resolve(ip);
                }
              }
            }
          }
        };
        
        // 短いタイムアウト
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            pc.close();
            console.log('⏰ 直接検出タイムアウト, 発見IP:', foundIP);
            resolve(foundIP);
          }
        }, 2000);
        
        // 単純なoffer作成
        pc.createDataChannel('direct');
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch((error) => {
            console.warn('直接検出エラー:', error);
            if (!resolved) {
              resolved = true;
              pc.close();
              resolve(null);
            }
          });
      });
    } catch (error) {
      console.warn('🔍 直接IP検出エラー:', error);
      return null;
    }
  };

  // バッチファイルと同様の実際のネットワークIP取得
  const getActualNetworkIPs = useCallback(async (): Promise<Array<{ip: string, source: string}>> => {
    console.log('🔍 実際のネットワークIPを動的検出中...');
    const foundIPs: Array<{ip: string, source: string}> = [];

    try {
      // Method 1: 環境変数から検出されたIPアドレスを取得（最優先）
      const envDetectedIP = process.env.REACT_APP_DETECTED_IP;
      console.log('🔍 環境変数チェック: REACT_APP_DETECTED_IP =', envDetectedIP);
      if (envDetectedIP && envDetectedIP !== 'localhost' && isPrivateIP(envDetectedIP)) {
        foundIPs.push({ip: envDetectedIP, source: 'env-detected'});
        console.log('🌟 環境変数検出IP使用:', envDetectedIP);
        
        // 環境変数でIPが見つかったら即座に使用
        return [{ip: envDetectedIP, source: 'env-detected'}];
      }

      // Method 1.5: 現在のページのホストから直接IPを取得（シンプルで確実）
      const currentHost = window.location.hostname;
      if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1' && isPrivateIP(currentHost)) {
        foundIPs.push({ip: currentHost, source: 'current-host'});
        console.log('🌐 現在のホストIP使用:', currentHost);
      }

      // Method 2: Navigator API（利用可能な場合）
      if ('connection' in navigator && (navigator as any).connection) {
        console.log('📡 Network Information API利用可能');
      }

      // Method 2: WebRTC経由で実際のアクティブIPを取得
      const activeIPs = await getActiveLocalIPs();
      activeIPs.forEach(ip => foundIPs.push({ip, source: 'webrtc'}));

      // Method 3: バッチファイルで保存されたIPファイルを読み取り（最優先）
      try {
        const fileResponse = await fetch('/detected-ip.json', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (fileResponse.ok) {
          const ipData = await fileResponse.json();
          if (ipData.detectedIP && ipData.detectedIP !== 'localhost') {
            foundIPs.push({ip: ipData.detectedIP, source: 'batch-detected'});
            console.log('🎯 バッチファイル検出IP使用:', ipData.detectedIP, 'タイムスタンプ:', ipData.timestamp);
          }
        }
      } catch (error) {
        console.log('📁 バッチ検出ファイル読み取り失敗（正常）');
      }

      // Method 4: Node.js IPサーバーからの取得を試行（バッチファイルと同様の検出方法）
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        const serverResponse = await fetch('http://localhost:3001/api/local-ip', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        if (serverResponse.ok) {
          const data = await serverResponse.json();
          if (data.ip && !foundIPs.some(item => item.ip === data.ip)) {
            foundIPs.push({ip: data.ip, source: 'server-side'});
            console.log('🖥️ IPサーバーから取得:', data.ip);
          }
          if (data.allIPs) {
            data.allIPs.forEach((ip: string) => {
              if (!foundIPs.some(item => item.ip === ip)) {
                foundIPs.push({ip, source: 'server-side'});
              }
            });
          }
        }
      } catch (error) {
        console.log('🖥️ IPサーバー接続失敗（正常）- バッチファイル方式にフォールバック');
        
        // Method 4: バッチファイルと同様のブラウザベースIP検出
        const batchStyleIPs = await getBatchStyleLocalIPs();
        batchStyleIPs.forEach(ip => foundIPs.push({ip, source: 'network-connectivity'}));
      }

      console.log('✅ 動的検出完了:', foundIPs);
      return foundIPs;
    } catch (error) {
      console.warn('⚠️ 実際のネットワークIP取得エラー:', error);
      return [];
    }
  }, []);

  // アクティブなローカルIPアドレスを取得
  const getActiveLocalIPs = useCallback(async (): Promise<string[]> => {
    return new Promise((resolve) => {
      const ips: string[] = [];
      
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            // host candidate（直接的なローカルIP）のみを対象
            if (candidate.includes('typ host')) {
              const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
              if (ipMatch) {
                const ip = ipMatch[1];
                if (isPrivateIP(ip) && ip !== '127.0.0.1' && !ips.includes(ip)) {
                  ips.push(ip);
                  console.log('🎯 アクティブなローカルIP発見:', ip);
                }
              }
            }
          } else {
            // ICE収集完了
            pc.close();
            resolve(ips);
          }
        };

        // タイムアウト設定
        setTimeout(() => {
          pc.close();
          resolve(ips);
        }, 3000);

        // ICE収集開始
        pc.createDataChannel('test');
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(() => {
            pc.close();
            resolve(ips);
          });
      } catch (error) {
        console.warn('WebRTCアクティブIP検出エラー:', error);
        resolve([]);
      }
    });
  }, [isPrivateIP]);

  // クライアントIPを動的にスキャン
  const scanClientIPs = useCallback(async (prefix: string): Promise<string[]> => {
    console.log(`🔍 ${prefix} 範囲でクライアントIPスキャン`);
    const clientIPs: string[] = [];
    const testPromises: Promise<void>[] = [];

    // より広範囲の一般的なクライアントIP範囲をテスト
    const testRange = [2, 3, 4, 5, 10, 11, 12, 20, 25, 30, 50, 100, 101, 102, 150, 200];
    
    for (const num of testRange) {
      const testIP = `${prefix}.${num}`;
      
      testPromises.push(
        testIPConnection(testIP, 30).then(isActive => {
          if (isActive) {
            clientIPs.push(testIP);
            console.log(`✅ クライアントIP発見: ${testIP}`);
          }
        }).catch(() => {
          // エラーは無視
        })
      );

      // 同時接続数制限
      if (testPromises.length >= 8) {
        await Promise.allSettled(testPromises);
        testPromises.length = 0;
      }
    }

    // 残りの処理完了
    if (testPromises.length > 0) {
      await Promise.allSettled(testPromises);
    }

    return clientIPs;
  }, []);

  // バッチファイルと同様のブラウザベースIP検出
  const getBatchStyleLocalIPs = useCallback(async (): Promise<string[]> => {
    console.log('🔍 バッチファイルスタイルIP検出開始...');
    const foundIPs: string[] = [];
    
    try {
      // 現在のWebページのホスト情報から推測
      const currentHost = window.location.hostname;
      const currentPort = window.location.port || '3000';
      
      if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        if (isPrivateIP(currentHost)) {
          foundIPs.push(currentHost);
          console.log('🌐 現在のホストIP使用:', currentHost);
          return foundIPs;
        }
      }
      
      // バッチファイルのipconfigに相当する処理：ネットワークインターフェース情報の推測
      const networkChecks = await performNetworkConnectivityChecks();
      foundIPs.push(...networkChecks);
      
      console.log('✅ バッチファイルスタイル検出完了:', foundIPs);
      return Array.from(new Set(foundIPs)); // 重複除去
    } catch (error) {
      console.warn('⚠️ バッチファイルスタイル検出エラー:', error);
      return [];
    }
  }, [isPrivateIP]);

  // ネットワーク接続性チェック（バッチファイルのipconfig相当）
  const performNetworkConnectivityChecks = useCallback(async (): Promise<string[]> => {
    console.log('🔍 ネットワーク接続性チェック実行...');
    const activeIPs: string[] = [];
    
    // 一般的なプライベートネットワーク範囲を効率的にテスト
    const networkRanges = [
      { prefix: '192.168.1', priority: 100 },
      { prefix: '192.168.0', priority: 90 },
      { prefix: '192.168.2', priority: 80 },
      { prefix: '10.0.0', priority: 70 },
      { prefix: '10.0.1', priority: 60 },
      { prefix: '172.16.0', priority: 50 }
    ];
    
    for (const range of networkRanges) {
      try {
        // ゲートウェイの存在確認（バッチファイルでのデフォルトゲートウェイチェック相当）
        const gateway = `${range.prefix}.1`;
        const gatewayReachable = await quickConnectivityTest(gateway);
        
        if (gatewayReachable) {
          console.log(`✅ アクティブネットワーク発見: ${range.prefix}.x`);
          
          // このネットワーク範囲内でアクティブなホストIPを検索
          const hosts = await findActiveHostsInRange(range.prefix);
          activeIPs.push(...hosts);
          
          // 最初にアクティブなネットワークが見つかったら優先
          if (hosts.length > 0) {
            break;
          }
        }
      } catch (error) {
        console.log(`❌ ${range.prefix}.x ネットワーク非アクティブ`);
      }
    }
    
    return activeIPs;
  }, []);

  // 指定範囲内のアクティブホストを検索
  const findActiveHostsInRange = useCallback(async (prefix: string): Promise<string[]> => {
    console.log(`🔍 ${prefix}.x 範囲内のアクティブホスト検索...`);
    const activeHosts: string[] = [];
    const testPromises: Promise<void>[] = [];
    
    // 一般的なホストIP範囲を大幅に拡張（DHCP範囲90-100番台を含む）
    const hostNumbers = [2, 3, 4, 5, 6, 10, 11, 12, 20, 25, 30, 50, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 150, 200];
    
    for (const num of hostNumbers) {
      const testIP = `${prefix}.${num}`;
      
      testPromises.push(
        quickConnectivityTest(testIP).then(isReachable => {
          if (isReachable) {
            activeHosts.push(testIP);
            console.log(`🎯 アクティブホスト発見: ${testIP}`);
          }
        }).catch(() => {
          // エラーは無視（接続できないのは正常）
        })
      );
      
      // 同時接続数制限
      if (testPromises.length >= 5) {
        await Promise.allSettled(testPromises);
        testPromises.length = 0;
      }
    }
    
    // 残りの処理完了
    if (testPromises.length > 0) {
      await Promise.allSettled(testPromises);
    }
    
    return activeHosts;
  }, []);

  // 高速接続テスト（バッチファイルのping相当）
  const quickConnectivityTest = useCallback(async (ip: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 200); // 非常に短いタイムアウト
      
      // 軽量な接続テスト
      await fetch(`http://${ip}:80`, {
        mode: 'no-cors',
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // 接続エラーは期待される動作
      return false;
    }
  }, []);

  // 高速サブネットスキャン
  const quickScanSubnet = async (subnet: string): Promise<string[]> => {
    console.log('🔍 高速サブネットスキャン:', subnet);
    const foundIPs: string[] = [];
    const promises: Promise<void>[] = [];
    
    // より限定的な範囲でスキャン（94番台DHCP範囲を重点的に含む）
    const targetIPs = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 30, 50, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 150, 200, 250];
    
    for (const num of targetIPs) {
      const testIP = `${subnet}.${num}`;
      
      promises.push(
        testIPConnection(testIP, 30).then(isActive => {
          if (isActive) {
            foundIPs.push(testIP);
            console.log('✅ 高速スキャンでIPを発見:', testIP);
          }
        }).catch(() => {
          // エラーは無視
        })
      );
      
      // 同時接続数を制限
      if (promises.length >= 5) {
        await Promise.allSettled(promises);
        promises.length = 0;
      }
    }
    
    // 残りの処理を完了
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    return foundIPs;
  };

  // 環境からIPv4範囲を推測
  const tryGuessIPv4FromEnvironment = async (): Promise<void> => {
    console.log('🔍 環境からIPv4範囲を推測中...');
    
    // 一般的な家庭用ルーター範囲を優先的にテスト
    const commonHomePrefixes = ['192.168.1', '192.168.0', '192.168.100'];
    
    for (const prefix of commonHomePrefixes) {
      try {
        // ゲートウェイテスト
        const gateway = `${prefix}.1`;
        const isReachable = await testIPConnection(gateway, 100);
        
        if (isReachable) {
          console.log(`✅ ゲートウェイ発見: ${gateway} - この範囲でスキャン実行`);
          // この範囲のクライアントIPを動的にスキャン
          const clientIPs = await scanClientIPs(prefix);
          
          for (const clientIP of clientIPs) {
            try {
              const isClientActive = await testIPConnection(clientIP, 50);
              if (isClientActive) {
                console.log(`🎯 アクティブなクライアントIP発見: ${clientIP}`);
                // これが実際のローカルIPの可能性が高い
                return;
              }
            } catch (error) {
              // 継続
            }
          }
        }
      } catch (error) {
        // 次の範囲を試行
      }
    }
  };

  // 積極的なローカルIPスキャン（WebRTCが失敗した場合）
  const aggressiveLocalIPScan = async (): Promise<string[]> => {
    console.log('🚀 積極的なローカルIPスキャンを開始...');
    const foundIPs: string[] = [];
    
    // より多くの一般的な範囲を並行でテスト
    const ranges = [
      '192.168.1', '192.168.0', '192.168.2', '192.168.100',
      '10.0.0', '10.0.1', '10.1.1',
      '172.16.0', '172.20.0'
    ];
    
    const scanPromises = ranges.map(async (range) => {
      // 各範囲で最も可能性の高いIPを動的にテスト（94番台DHCP範囲を含む）
      const candidateIPs = [
        `${range}.2`, `${range}.3`, `${range}.4`, `${range}.5`, `${range}.6`,
        `${range}.10`, `${range}.20`, `${range}.25`, `${range}.30`,
        `${range}.90`, `${range}.91`, `${range}.92`, `${range}.93`, `${range}.94`, `${range}.95`,
        `${range}.100`, `${range}.101`, `${range}.102`
      ];
      
      for (const ip of candidateIPs) {
        try {
          const isActive = await testIPConnection(ip, 20); // 短いタイムアウト
          if (isActive && isPrivateIP(ip)) {
            foundIPs.push(ip);
            console.log(`🎯 積極的スキャンでIP発見: ${ip}`);
            return ip; // 最初に見つかったIPを返す
          }
        } catch (error) {
          // 継続
        }
      }
      return null;
    });
    
    // 並行実行して最初に見つかったものを使用
    await Promise.allSettled(scanPromises);
    
    return foundIPs;
  };

  // WebSocket接続テスト関数
  const testWebSocketConnection = async (ip: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(`ws://${ip}:80`);
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 300);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
        
        ws.onclose = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch (error) {
        resolve(false);
      }
    });
  };

  // IPアドレスの優先度スコアを計算（動的・ハードコーディング無し）
  const getIPPriorityScore = useCallback((ip: string, source?: string): number => {
    let score = 0;
    
    // プライベートIPかチェック
    if (!isPrivateIP(ip) && ip !== '127.0.0.1') {
      return 0; // パブリックIPは除外
    }
    
    // サーバーサイドで検出されたIPは最高優先度
    if (source === 'server-side') {
      score += 200;
      console.log(`🖥️ サーバーサイドIP最高優先度: ${ip} score: ${score}`);
      return score;
    }
    
    // 192.168.x.x 範囲（最も一般的）
    if (ip.startsWith('192.168.')) {
      score += 100;
      
      // ゲートウェイではないIPにボーナス
      if (!ip.endsWith('.1') && !ip.endsWith('.254')) {
        score += 20;
      }
      
      // 低い番号のホストIPにボーナス（通常は静的IP）
      const lastOctet = parseInt(ip.split('.')[3]);
      if (lastOctet >= 2 && lastOctet <= 50) {
        score += 10;
      }
      
      // 動的に検出されたアクティブなIPにボーナス（環境に依存しない方式）
      if (lastOctet >= 90 && lastOctet <= 100) {
        score += 30; // DHCP範囲の一般的な領域
      } else if (lastOctet >= 2 && lastOctet <= 10) {
        score += 40; // 低番号（通常は静的設定）- より高い優先度
      } else if (lastOctet >= 11 && lastOctet <= 50) {
        score += 25; // 中番号領域
      }
    }
    
    // 10.x.x.x 範囲
    else if (ip.startsWith('10.')) {
      score += 80;
      
      // ゲートウェイではないIPにボーナス
      if (!ip.endsWith('.1') && !ip.endsWith('.254')) {
        score += 15;
      }
    }
    
    // 172.16-31.x.x 範囲
    else if (ip.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      score += 70;
      
      // ゲートウェイではないIPにボーナス
      if (!ip.endsWith('.1') && !ip.endsWith('.254')) {
        score += 15;
      }
    }
    
    // ローカルホストは最低優先度
    else if (ip === '127.0.0.1') {
      score += 5;
    }
    
    // 検出方法による優先度ボーナス（現在のホストを最優先）
    if (source === 'current-host') {
      score += 250; // 現在アクセスしているホストIPは最も信頼性が高い
    } else if (source === 'env-detected') {
      score += 200; // 環境変数で検出されたIPは最も信頼性が高い
    } else if (source === 'batch-detected') {
      score += 100; // バッチファイルで検出されたIPも高い信頼性
    } else if (source === 'server-side') {
      score += 80; // サーバーサイドで検出されたIPは高い信頼性
    } else if (source === 'webrtc') {
      score += 60; // WebRTCで直接検出されたIPは実際にアクティブ
    } else if (source === 'network-connectivity') {
      score += 50; // ネットワーク接続テストで確認されたIP
    } else if (source === 'network-scan') {
      score += 20; // ネットワークスキャンで発見されたIP
    }
    
    console.log(`📊 IP ${ip} (${source || 'unknown'}) priority score: ${score}`);
    return score;
  }, [isPrivateIP]);

  // IPアドレスの優先度を決定する関数（ソース情報付き）
  const prioritizeIPAddresses = useCallback((ips: Array<{ip: string, source: string}>): string[] => {
    return ips.sort((a, b) => {
      // 優先度スコアを計算
      const scoreA = getIPPriorityScore(a.ip, a.source);
      const scoreB = getIPPriorityScore(b.ip, b.source);
      
      return scoreB - scoreA; // 高いスコアを先に
    }).map(item => item.ip);
  }, [getIPPriorityScore]);

  // サーバーサイドからIPアドレスを取得（開発サーバー利用）
  const getServerSideIP = useCallback(async (): Promise<string | null> => {
    try {
      console.log('🖥️ サーバーサイドからローカルIP取得を試行...');
      
      // React開発サーバーの情報から推測
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;
      
      console.log(`📍 現在のアクセス情報: ${currentHost}:${currentPort}`);
      
      // localhostでアクセスしている場合、実際のIPを推測
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        console.log('🔍 localhost接続検出 - 実際のローカルIPを探索...');
        
        // バッチファイルと同様の方法で動的IP検出を試行
        const possibleIPsWithSource = await getActualNetworkIPs();
        const possibleIPs = possibleIPsWithSource.map(item => item.ip);
        
        for (const ip of possibleIPs) {
          try {
            // 同じポートでアクセス可能かテスト
            const testUrl = `http://${ip}:${currentPort || '3000'}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            
            const response = await fetch(testUrl + '/static/js/bundle.js', {
              method: 'HEAD',
              mode: 'no-cors',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log(`✅ サーバーサイドIP発見: ${ip}`);
            return ip;
          } catch (error) {
            // 次のIPを試行
            console.log(`❌ ${ip} でアクセス失敗`);
          }
        }
      } else if (isPrivateIP(currentHost)) {
        console.log(`✅ プライベートIPで直接アクセス: ${currentHost}`);
        return currentHost;
      }
      
      return null;
    } catch (error) {
      console.warn('🖥️ サーバーサイドIP取得エラー:', error);
      return null;
    }
  }, [isPrivateIP]);

  // 複数の方法でローカルIPアドレスを取得する関数
  const getLocalIPAddresses = useCallback(async (): Promise<string[]> => {
    const allIPs: Array<{ip: string, source: string}> = [];

    console.log('🔍 Starting IP address detection...'); // デバッグ用

    // 方法1: サーバーサイド情報から取得（最優先）
    try {
      console.log('🖥️ Trying server-side method...');
      const serverIP = await getServerSideIP();
      if (serverIP) {
        console.log('🖥️ Server-side found IP:', serverIP);
        allIPs.push({ip: serverIP, source: 'server-side'});
      }
    } catch (error) {
      console.warn('🖥️ サーバーサイド方式でのIP取得に失敗:', error);
    }

    // 方法2: WebRTC APIを使用
    try {
      console.log('📡 Trying WebRTC method...');
      const webrtcIPs = await getLocalIPsViaWebRTC();
      console.log('📡 WebRTC found IPs:', webrtcIPs);
      webrtcIPs.forEach(ip => allIPs.push({ip, source: 'webrtc'}));
    } catch (error) {
      console.warn('📡 WebRTC方式でのIP取得に失敗:', error);
    }

    // 方法3: Network Information APIを使用（利用可能な場合）
    try {
      const networkIPs = await getLocalIPsViaNetworkAPI();
      networkIPs.forEach(ip => allIPs.push({ip, source: 'network-api'}));
    } catch (error) {
      console.warn('🌐 Network API方式でのIP取得に失敗:', error);
    }

    // 方法4: 一般的なローカルIPの推測
    try {
      console.log('🔍 Trying common IP detection...');
      const commonIPs = await getCommonLocalIPs();
      console.log('🔍 Common IP detection found:', commonIPs);
      commonIPs.forEach(ip => allIPs.push({ip, source: 'network-scan'}));
    } catch (error) {
      console.warn('🔍 一般的なIP推測に失敗:', error);
    }

    // 重複除去（同じIPは最高優先度のソースのみ保持）
    const uniqueIPs = Array.from(new Map(
      allIPs.map(item => [item.ip, item])
    ).values());
    
    console.log('📋 Final IP list with sources:', uniqueIPs); // デバッグ用
    
    // 優先度に基づいてIPアドレスをソート
    const sortedIPs = prioritizeIPAddresses(uniqueIPs);
    console.log('📊 Prioritized IP list:', sortedIPs); // デバッグ用
    
    // 最も適切なIPアドレスのみを返す（最大3つまで）
    return sortedIPs.slice(0, 3);
  }, [getServerSideIP, getLocalIPsViaWebRTC, getLocalIPsViaNetworkAPI, getCommonLocalIPs, prioritizeIPAddresses]);


  // パブリックIPアドレスを取得する関数
  const getPublicIPAddress = useCallback(async (): Promise<string | null> => {
    try {
      // 複数のサービスを試行して信頼性を向上
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://jsonip.com'
      ];

      for (const service of services) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(service, { 
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            // レスポンス形式に応じてIPアドレスを抽出
            if (data.ip) {
              return data.ip;
            } else if (data.query) {
              return data.query;
            }
          }
        } catch (serviceError) {
          console.warn(`IPサービス ${service} でエラー:`, serviceError);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('パブリックIP取得エラー:', error);
      return null;
    }
  }, []);

  // localhost アクセス時に実際のIPアドレスにリダイレクトする関数
  const tryRedirectToRealIP = useCallback(async () => {
    console.log('🔍 実際のIPアドレスを検出中...');
    
    try {
      // 複数の方法で実際のIPアドレスを取得
      const detectedIPs = await getLocalIPAddresses();
      
      if (detectedIPs.length > 0) {
        const realIP = detectedIPs[0]; // 最優先のIPアドレスを使用
        const currentPort = window.location.port || '3000';
        const newURL = `http://${realIP}:${currentPort}${window.location.pathname}${window.location.search}`;
        
        console.log('🎯 実際のIPアドレス検出:', realIP);
        console.log('🔄 リダイレクト先:', newURL);
        
        // ユーザーに確認してリダイレクト
        const shouldRedirect = window.confirm(
          `正しいIPアドレスが検出されました。\n\n` +
          `検出されたIP: ${realIP}\n` +
          `現在のアクセス: ${window.location.hostname}\n\n` +
          `正しいIPアドレスでアクセスしますか？\n` +
          `(推奨: はい)`
        );
        
        if (shouldRedirect) {
          console.log('✅ ユーザー承認 - リダイレクト実行');
          window.location.href = newURL;
        } else {
          console.log('❌ ユーザーキャンセル - localhost のまま継続');
        }
      } else {
        console.log('❌ 実際のIPアドレスを検出できませんでした');
      }
    } catch (error) {
      console.warn('⚠️ リダイレクト処理でエラー:', error);
    }
  }, [getLocalIPAddresses]);

  useEffect(() => {
    const fetchIPAddresses = async () => {
      setIpInfo(prev => ({ ...prev, loading: true, error: null }));

      try {
        // 最優先: 環境変数から検出されたIPアドレスをチェック
        const envDetectedIP = process.env.REACT_APP_DETECTED_IP;
        console.log('🔍 最優先チェック: REACT_APP_DETECTED_IP =', envDetectedIP);
        if (envDetectedIP && envDetectedIP !== 'localhost' && isPrivateIP(envDetectedIP)) {
          console.log('🎯 環境変数検出IP使用:', envDetectedIP);
          setIpInfo({
            local: [envDetectedIP],
            public: null,
            loading: false,
            error: null
          });
          return; // 環境変数IPが見つかったらそれを使用
        }

        // 次に現在のホストIPを確認
        const currentHost = window.location.hostname;
        console.log('🔍 デバッグ: window.location.hostname =', currentHost);
        console.log('🔍 デバッグ: window.location.href =', window.location.href);
        console.log('🔍 デバッグ: isPrivateIP check =', currentHost ? isPrivateIP(currentHost) : 'N/A');
        
        if (currentHost && currentHost !== 'localhost' && currentHost !== '127.0.0.1' && isPrivateIP(currentHost)) {
          console.log('🎯 現在のホストIP検出成功:', currentHost);
          setIpInfo({
            local: [currentHost],
            public: null,
            loading: false,
            error: null
          });
          return; // 現在のホストIPが見つかったらそれを使用
        } else {
          console.log('⚠️ 現在のホストIPが使用できません。他の方法を試行...');
          console.log('  - hostname:', currentHost);
          console.log('  - localhost check:', currentHost === 'localhost');
          console.log('  - 127.0.0.1 check:', currentHost === '127.0.0.1');
          console.log('  - private IP check:', currentHost ? isPrivateIP(currentHost) : false);
          
          // localhost でアクセスしている場合の情報表示（リダイレクト無効化）
          if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            console.log('ℹ️ localhost検出 - 環境変数でIP検出を継続...');
            console.log('ℹ️ 正しいIPでアクセスする場合は、バッチファイルで表示されたURLを使用してください');
            // tryRedirectToRealIP(); // 複数タブ防止のため無効化
          }
        }

        // ローカルIPとパブリックIPを並行して取得
        const [localIPs, publicIP] = await Promise.all([
          getLocalIPAddresses(),
          getPublicIPAddress()
        ]);

        setIpInfo({
          local: localIPs,
          public: publicIP,
          loading: false,
          error: null
        });
      } catch (error) {
        setIpInfo({
          local: [],
          public: null,
          loading: false,
          error: error instanceof Error ? error.message : 'IPアドレスの取得に失敗しました'
        });
      }
    };

    fetchIPAddresses();
  }, []);

  return ipInfo;
};
