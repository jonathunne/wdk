'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import WalletManager from '@tetherto/wdk-wallet'

import { BridgeProtocol, LendingProtocol, SwapProtocol } from '@tetherto/wdk-wallet/protocols'

import WdkManager from '../index.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const getAccountMock = jest.fn(),
      getAccountByPathMock = jest.fn(),
      getFeeRatesMock = jest.fn(),
      disposeMock = jest.fn()

const WalletManagerMock = jest.fn().mockImplementation((seed, config) => {
  return Object.create(WalletManager.prototype, {
    getAccount: {
      value: getAccountMock
    },
    getAccountByPath: {
      value: getAccountByPathMock
    },
    getFeeRates: {
      value: getFeeRatesMock
    },
    dispose: {
      value: disposeMock
    }
  })
})

describe('WdkManager', () => {
  const CONFIG = { transferMaxFee: 100 }

  let wdkManager
  let DUMMY_ACCOUNT

  beforeEach(() => {
    wdkManager = new WdkManager(SEED_PHRASE)
    DUMMY_ACCOUNT = {
      getAddress: async () => {
        return '0xa460AEbce0d3A4BecAd8ccf9D6D4861296c503Bd'
      }
    }
  })

  describe('getAccount', () => {
    beforeEach(() => {
      getAccountMock.mockResolvedValue(DUMMY_ACCOUNT)
    })

    test('should return the account at the given index', async () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

      const account = await wdkManager.getAccount('ethereum', 0)

      expect(WalletManagerMock).toHaveBeenCalledWith(SEED_PHRASE, CONFIG)

      expect(getAccountMock).toHaveBeenCalledWith(0)

      expect(account).toEqual(DUMMY_ACCOUNT)
    })

    test('should trigger middlewares', async () => {
      const middleware = jest.fn()

      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                .registerMiddleware('ethereum', middleware)

      const account = await wdkManager.getAccount('ethereum', 0)

      expect(middleware).toHaveBeenCalledWith(DUMMY_ACCOUNT)

      expect(account).toEqual(DUMMY_ACCOUNT)
    })

    test('should throw if no wallet has been registered for the given blockchain', async () => {
      await expect(wdkManager.getAccount('ethereum', 0))
        .rejects.toThrow('No wallet registered for blockchain: ethereum.')
    })

    describe('should decorate the account instance with', () => {
      describe('getSwapProtocol', () => {
        const SWAP_CONFIG = { swapMaxFee: 100 }

        let SwapProtocolMock

        beforeEach(() => {
          SwapProtocolMock = jest.fn()

          Object.setPrototypeOf(SwapProtocolMock.prototype, SwapProtocol.prototype)
        })

        test("should return the swap protocol registered for the account's blockchain and the given label", async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                    .registerProtocol('ethereum', 'test', SwapProtocolMock, SWAP_CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          const protocol = account.getSwapProtocol('test')

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG)

          expect(protocol).toBeInstanceOf(SwapProtocolMock)
        })

        test('should return the swap protocol registered for the account and the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          account.registerProtocol('test', SwapProtocolMock, SWAP_CONFIG)

          const protocol = account.getSwapProtocol('test')

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG)

          expect(protocol).toBeInstanceOf(SwapProtocolMock)
        })

        test('should throw if no swap protocol has been registered for the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          expect(() => account.getSwapProtocol('test'))
            .toThrow('No swap protocol registered for label: test.')
        })

        test('should preserve account-scoped protocols across repeated getAccount calls', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)
          account.registerProtocol('test', SwapProtocolMock, SWAP_CONFIG)

          const sameAccount = await wdkManager.getAccount('ethereum', 0)

          expect(sameAccount).toBe(account)
          expect(() => sameAccount.getSwapProtocol('test')).not.toThrow()
          expect(sameAccount.getSwapProtocol('test')).toBeInstanceOf(SwapProtocolMock)
        })
      })

      describe('getBridgeProtocol', () => {
        const BRIDGE_CONFIG = { bridgeMaxFee: 100 }

        let BridgeProtocolMock

        beforeEach(() => {
          BridgeProtocolMock = jest.fn()

          Object.setPrototypeOf(BridgeProtocolMock.prototype, BridgeProtocol.prototype)
        })

        test("should return the bridge protocol registered for the account's blockchain and the given label", async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                    .registerProtocol('ethereum', 'test', BridgeProtocolMock, BRIDGE_CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          const protocol = account.getBridgeProtocol('test')

          expect(BridgeProtocolMock).toHaveBeenCalledWith(account, BRIDGE_CONFIG)

          expect(protocol).toBeInstanceOf(BridgeProtocolMock)
        })

        test('should return the bridge protocol registered for the account and the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          account.registerProtocol('test', BridgeProtocolMock, BRIDGE_CONFIG)

          const protocol = account.getBridgeProtocol('test')

          expect(BridgeProtocolMock).toHaveBeenCalledWith(account, BRIDGE_CONFIG)

          expect(protocol).toBeInstanceOf(BridgeProtocolMock)
        })

        test('should throw if no bridge protocol has been registered for the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          expect(() => account.getBridgeProtocol('test'))
            .toThrow('No bridge protocol registered for label: test.')
        })
      })

      describe('getLendingProtocol', () => {
        let LendingProtocolMock

        beforeEach(() => {
          LendingProtocolMock = jest.fn()

          Object.setPrototypeOf(LendingProtocolMock.prototype, LendingProtocol.prototype)
        })

        test("should return the lending protocol registered for the account's blockchain and the given label", async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                    .registerProtocol('ethereum', 'test', LendingProtocolMock, undefined)

          const account = await wdkManager.getAccount('ethereum', 0)

          const protocol = account.getLendingProtocol('test')

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined)

          expect(protocol).toBeInstanceOf(LendingProtocolMock)
        })

        test('should return the lending protocol registered for the account and the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          account.registerProtocol('test', LendingProtocolMock, undefined)

          const protocol = account.getLendingProtocol('test')

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined)

          expect(protocol).toBeInstanceOf(LendingProtocolMock)
        })

        test('should throw if no lending protocol has been registered for the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccount('ethereum', 0)

          expect(() => account.getLendingProtocol('test'))
            .toThrow('No lending protocol registered for label: test.')
        })
      })
    })
  })

  describe('getAccountByPath', () => {
    beforeEach(() => {
      getAccountByPathMock.mockResolvedValue(DUMMY_ACCOUNT)
    })

    test('should return the account at the given path', async () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

      const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

      expect(WalletManagerMock).toHaveBeenCalledWith(SEED_PHRASE, CONFIG)

      expect(getAccountByPathMock).toHaveBeenCalledWith("0'/0/0")

      expect(account).toEqual(DUMMY_ACCOUNT)
    })

    test('should trigger middlewares', async () => {
      const middleware = jest.fn()

      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                .registerMiddleware('ethereum', middleware)

      const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

      expect(middleware).toHaveBeenCalledWith(DUMMY_ACCOUNT)

      expect(account).toEqual(DUMMY_ACCOUNT)
    })

    test('should throw if no wallet has been registered for the given blockchain', async () => {
      await expect(wdkManager.getAccountByPath('ethereum', "0'/0/0"))
        .rejects.toThrow('No wallet registered for blockchain: ethereum.')
    })

    describe('should decorate the account instance with', () => {
      describe('getSwapProtocol', () => {
        const SWAP_CONFIG = { swapMaxFee: 100 }

        let SwapProtocolMock

        beforeEach(() => {
          SwapProtocolMock = jest.fn()

          Object.setPrototypeOf(SwapProtocolMock.prototype, SwapProtocol.prototype)
        })

        test("should return the swap protocol registered for the account's blockchain and the given label", async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                    .registerProtocol('ethereum', 'test', SwapProtocolMock, SWAP_CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          const protocol = account.getSwapProtocol('test')

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG)

          expect(protocol).toBeInstanceOf(SwapProtocolMock)
        })

        test('should return the swap protocol registered for the account and the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          account.registerProtocol('test', SwapProtocolMock, SWAP_CONFIG)

          const protocol = account.getSwapProtocol('test')

          expect(SwapProtocolMock).toHaveBeenCalledWith(account, SWAP_CONFIG)

          expect(protocol).toBeInstanceOf(SwapProtocolMock)
        })

        test('should throw if no swap protocol has been registered for the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          expect(() => account.getSwapProtocol('test'))
            .toThrow('No swap protocol registered for label: test.')
        })
      })

      describe('getBridgeProtocol', () => {
        const BRIDGE_CONFIG = { bridgeMaxFee: 100 }

        let BridgeProtocolMock

        beforeEach(() => {
          BridgeProtocolMock = jest.fn()

          Object.setPrototypeOf(BridgeProtocolMock.prototype, BridgeProtocol.prototype)
        })

        test("should return the bridge protocol registered for the account's blockchain and the given label", async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                    .registerProtocol('ethereum', 'test', BridgeProtocolMock, BRIDGE_CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          const protocol = account.getBridgeProtocol('test')

          expect(BridgeProtocolMock).toHaveBeenCalledWith(account, BRIDGE_CONFIG)

          expect(protocol).toBeInstanceOf(BridgeProtocolMock)
        })

        test('should return the bridge protocol registered for the account and the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          account.registerProtocol('test', BridgeProtocolMock, BRIDGE_CONFIG)

          const protocol = account.getBridgeProtocol('test')

          expect(BridgeProtocolMock).toHaveBeenCalledWith(account, BRIDGE_CONFIG)

          expect(protocol).toBeInstanceOf(BridgeProtocolMock)
        })

        test('should throw if no bridge protocol has been registered for the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          expect(() => account.getBridgeProtocol('test'))
            .toThrow('No bridge protocol registered for label: test.')
        })
      })

      describe('getLendingProtocol', () => {
        let LendingProtocolMock

        beforeEach(() => {
          LendingProtocolMock = jest.fn()

          Object.setPrototypeOf(LendingProtocolMock.prototype, LendingProtocol.prototype)
        })

        test("should return the lending protocol registered for the account's blockchain and the given label", async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
                    .registerProtocol('ethereum', 'test', LendingProtocolMock, undefined)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          const protocol = account.getLendingProtocol('test')

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined)

          expect(protocol).toBeInstanceOf(LendingProtocolMock)
        })

        test('should return the lending protocol registered for the account and the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          account.registerProtocol('test', LendingProtocolMock, undefined)

          const protocol = account.getLendingProtocol('test')

          expect(LendingProtocolMock).toHaveBeenCalledWith(account, undefined)

          expect(protocol).toBeInstanceOf(LendingProtocolMock)
        })

        test('should throw if no lending protocol has been registered for the given label', async () => {
          wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

          const account = await wdkManager.getAccountByPath('ethereum', "0'/0/0")

          expect(() => account.getLendingProtocol('test'))
            .toThrow('No lending protocol registered for label: test.')
        })
      })
    })
  })

  describe('registerWallet', () => {
    test('should throw if a wallet is already registered for the given blockchain', () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

      expect(() => wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG))
        .toThrow('A wallet is already registered for blockchain: ethereum. Call dispose(["ethereum"]) before re-registering.')
    })

    test('should allow re-registering after dispose', () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
      wdkManager.dispose(['ethereum'])

      expect(() => wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG))
        .not.toThrow()
    })
  })

  describe('registerProtocol', () => {
    test('should throw if the protocol does not extend a known base class', () => {
      class NotAProtocol {}

      expect(() => wdkManager.registerProtocol('ethereum', 'test', NotAProtocol, {}))
        .toThrow('Protocol must extend SwapProtocol, BridgeProtocol, LendingProtocol, or FiatProtocol.')
    })
  })

  describe('getFeeRates', () => {
    test('should return the correct fee rates for the given blockchain', async () => {
      const DUMMY_FEE_RATES = { normal: 100n, fast: 200n }

      getFeeRatesMock.mockResolvedValue(DUMMY_FEE_RATES)

      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

      const feeRates = await wdkManager.getFeeRates('ethereum')

      expect(feeRates).toEqual(DUMMY_FEE_RATES)
    })

    test('should throw if no wallet has been registered for the given blockchain', async () => {
      await expect(wdkManager.getFeeRates('ethereum'))
        .rejects.toThrow('No wallet registered for blockchain: ethereum.')
    })
  })

  describe('dispose', () => {
    beforeEach(() => {
      disposeMock.mockClear()
    })

    test('should dispose all wallets when called without arguments', () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
      wdkManager.registerWallet('bitcoin', WalletManagerMock, CONFIG)

      wdkManager.dispose()

      expect(disposeMock).toHaveBeenCalledTimes(2)
    })

    test('should dispose only the specified wallets', () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
      wdkManager.registerWallet('bitcoin', WalletManagerMock, CONFIG)

      wdkManager.dispose(['ethereum'])

      expect(disposeMock).toHaveBeenCalledTimes(1)
    })

    test('should unregister the wallet after disposal', async () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

      wdkManager.dispose(['ethereum'])

      await expect(wdkManager.getAccount('ethereum', 0))
        .rejects.toThrow('No wallet registered for blockchain: ethereum.')
    })

    test('should not affect wallets not in the list', async () => {
      getAccountMock.mockResolvedValue(DUMMY_ACCOUNT)

      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)
      wdkManager.registerWallet('bitcoin', WalletManagerMock, CONFIG)

      wdkManager.dispose(['bitcoin'])

      expect(disposeMock).toHaveBeenCalledTimes(1)
      await expect(wdkManager.getAccount('ethereum', 0)).resolves.toEqual(DUMMY_ACCOUNT)
    })

    test('should be a no-op when given an empty array', () => {
      wdkManager.registerWallet('ethereum', WalletManagerMock, CONFIG)

      wdkManager.dispose([])

      expect(disposeMock).not.toHaveBeenCalled()
    })

    test('should zero the seed bytes when disposing all wallets', () => {
      const seed = new Uint8Array(64).fill(0xab)
      const wdk = new WdkManager(seed)

      wdk.dispose()

      expect(seed.every((b) => b === 0)).toBe(true)
    })

    test('should not zero the seed bytes when disposing a subset of wallets', () => {
      const seed = new Uint8Array(64).fill(0xab)
      const wdk = new WdkManager(seed)
      wdk.registerWallet('ethereum', WalletManagerMock, CONFIG)

      wdk.dispose(['ethereum'])

      expect(seed.every((b) => b === 0xab)).toBe(true)
    })
  })
})
