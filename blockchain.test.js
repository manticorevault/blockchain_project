const Blockchain = require('./blockchain');
const Block = require('./block');
const cryptoHash = require('./crypto-hash');

describe('Blockchain', () => {
    let blockchain, newChain, originalChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();

        originalChain = blockchain.chain;
    });

    it('Contains a `chain` Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it('Starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis()); 
    });

    it('Adds a new block to the chain', () => {
        const newData ='foo bar';
        blockchain.addBlock({ data: newData });

        expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);
    });

    describe('isValidChain()', () => {
        describe('When the chain DOES NOT start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' }

                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('When the chain starts with the genesis block and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({ data: 'White' })
                blockchain.addBlock({ data: 'Manes' })
                blockchain.addBlock({ data: 'Ftw' });

            });

            describe('And a lastHash reference has changed', () => {
                it('returns false', () => {

                    blockchain.chain[2].lastHash = 'broken-lastHash';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain contains a block with an invalid field', () => {
                it('returns false', () => {

                    blockchain.chain[2].data = 'shitty-data';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chains contains a block with a jumped difficulty', () => {
                it('returns false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length-1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
                    const badBlock = new Block({ 
                        timestamp, lastHash, difficulty, nonce, data 
                    });

                    blockchain.chain.push(badBlock);

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('and the chain does not contains any invalid blocks', () => {
                it('returns true', () => {

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });
        });
    });

    describe('replaceChain()', () => {
        let errorMock, logMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();

            global.console.error = errorMock;
            global.console.log = logMock;
        })

        describe('When the new generated chain is not longer than the checked chain', () => {
            beforeEach(() => {
                newChain.chain[0] = { new: 'chain' };

                blockchain.replaceChain(newChain.chain);

            });

            it('The method does not replace the chain', () => {

                expect(blockchain.chain).toEqual(originalChain);
            });
            
            it('Logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('When the new chain is longer', () => {
            
            beforeEach(() => {
                newChain.addBlock({ data: 'White' })
                newChain.addBlock({ data: 'Manes' })
                newChain.addBlock({ data: 'Ftw' });
            });

            describe('And the chain is INVALID', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'fake-hash';

                    blockchain.replaceChain(newChain.chain);
                });

                it('The method DOES NOT replace the chain', () => {

                    expect(blockchain.chain).toEqual(originalChain);
                });

                it('Logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('and the chain is VALID', () => {
                beforeEach(() => {

                    blockchain.replaceChain(newChain.chain);
                });

                it('The method REPLACES the chain', () => {

                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('Logs about the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();

                });
            });
        });
    });
});