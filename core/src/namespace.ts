export class Namespace {
  readonly abbreviationPrefix: string;

  readonly baseIri: string;

  constructor(baseIri: string, abbreviationPrefix: string) {
    this.abbreviationPrefix = abbreviationPrefix;
    this.baseIri = baseIri;
    Object.freeze(this);
  }

  /**
   * Returns an abbreviated IRI if the specified iri starts with the baseIri; the unchanged input
   * String otherwise;
   *
   * @param iri
   * @return
   */
  public abbreviate(iri: string): string {
    if (this.isFullNamespaceIri(iri)) {
      return this.abbreviationPrefix + ":" + iri.substring(this.baseIri.length);
    }
    return iri;
  }

  public expand(abbreviatedIri: string): string {
    if (this.isAbbreviatedNamespaceIri(abbreviatedIri)) {
      return (
        this.baseIri +
        abbreviatedIri.substring(this.abbreviationPrefix.length + 1)
      );
    }
    return abbreviatedIri;
  }

  /**
   * Returns true if the specified abbreviatedIri starts with the namespace's abbreviation prefix.
   */
  public isAbbreviatedNamespaceIri(abbreviatedIri: string): boolean {
    return abbreviatedIri.startsWith(this.abbreviationPrefix + ":");
  }

  /** Returns true if the specified iri starts with the namespace's baseIri. */
  public isFullNamespaceIri(iri: string): boolean {
    return iri.startsWith(this.baseIri);
  }

  /**
   * Prepends the namespace's baseIri to the specified localName.
   *
   * @param localName
   * @return
   */
  public makeIriInNamespace(localName: string): string {
    return this.baseIri + localName;
  }
}
